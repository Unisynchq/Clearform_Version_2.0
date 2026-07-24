import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, UnrecoverableError } from 'bullmq';
import { SUPPORTED_COMPOSIO_PROVIDERS } from './composio.service';
import { classifyDispatchError } from './composio-error.util';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationProviderFactory } from './providers/integration-provider.factory';
import { ComposioService } from './composio.service';
import {
  buildIntegrationHealth,
  isFormEnabledForIntegration,
  parseFormAnswersPayload,
  parseIntegrationMetadata,
  parsePublishedSnapshot,
  resolveNotionDatabaseId,
  resolveSpreadsheetId,
  resolveSlackChannel,
} from './integration-metadata.util';
import type {
  ComposioAccountVerifyStatus,
  IntegrationConnectionMetadata,
} from './integration-types';

// ---------------------------------------------------------------------------
// Task 1.2 — deepMergeMetadata helper
// formSpreadsheetIds / formSlackChannels → entry-level merge (never clobber)
// enabledFormIds → full replacement when present in patch
// All other fields → direct assignment
// ---------------------------------------------------------------------------
function deepMergeMetadata(
  prior: IntegrationConnectionMetadata,
  patch: Record<string, unknown>,
): IntegrationConnectionMetadata {
  const merged: IntegrationConnectionMetadata = { ...prior };

  for (const [key, value] of Object.entries(patch)) {
    if (
      key === 'formSpreadsheetIds' &&
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      merged.formSpreadsheetIds = {
        ...(prior.formSpreadsheetIds ?? {}),
        ...(value as Record<string, string>),
      };
    } else if (
      key === 'formSlackChannels' &&
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      merged.formSlackChannels = {
        ...(prior.formSlackChannels ?? {}),
        ...(value as Record<string, string>),
      };
    } else if (key === 'enabledFormIds') {
      merged.enabledFormIds = Array.isArray(value)
        ? (value as string[])
        : prior.enabledFormIds;
    } else {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: IntegrationProviderFactory,
    // Task 5.1 — inject ComposioService directly for verifyConnectedAccount
    private readonly composioService: ComposioService,
    @InjectQueue('integrations')
    private readonly integrationsQueue: Queue,
  ) {}

  private get provider() {
    return this.providerFactory.getProvider();
  }

  private async assertWorkspaceOwner(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId: userId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  private mapConnectionWithHealth(
    conn: {
      id: string;
      workspaceId: string;
      provider: string;
      composioEntityId: string | null;
      metadata: Prisma.JsonValue | null;
      active: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    formId?: string,
  ) {
    const metadata = parseIntegrationMetadata(conn.metadata);
    return {
      ...conn,
      health: buildIntegrationHealth(metadata, formId),
    };
  }

  async list(workspaceId: string, userId: string, formId?: string) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const rows = await this.prisma.integrationConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((conn) => this.mapConnectionWithHealth(conn, formId));
  }

  async create(
    workspaceId: string,
    userId: string,
    data: {
      provider: string;
      composioEntityId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const created = await this.prisma.integrationConnection.create({
      data: {
        workspaceId,
        provider: data.provider,
        composioEntityId: data.composioEntityId,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        active: true,
      },
    });
    return this.mapConnectionWithHealth(created);
  }

  // Task 2.1 — use deepMergeMetadata instead of shallow spread
  async update(
    id: string,
    workspaceId: string,
    userId: string,
    data: {
      composioEntityId?: string;
      metadata?: Record<string, unknown>;
      active?: boolean;
    },
  ) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const existing = await this.prisma.integrationConnection.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Integration not found');

    const prior = parseIntegrationMetadata(existing.metadata);
    const mergedMetadata =
      data.metadata !== undefined
        ? deepMergeMetadata(prior, data.metadata)
        : prior;

    const updated = await this.prisma.integrationConnection.update({
      where: { id },
      data: {
        composioEntityId: data.composioEntityId,
        metadata: mergedMetadata,
        active: data.active,
      },
    });
    return this.mapConnectionWithHealth(updated);
  }

  async remove(id: string, workspaceId: string, userId: string) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const existing = await this.prisma.integrationConnection.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Integration not found');
    return this.prisma.integrationConnection.delete({ where: { id } });
  }

  // Task 4.1 — upsert DB row BEFORE calling SDK (prevents orphan rows on SDK failure)
  async initiateConnect(workspaceId: string, userId: string, provider: string) {
    await this.assertWorkspaceOwner(workspaceId, userId);

    if (
      !(SUPPORTED_COMPOSIO_PROVIDERS as readonly string[]).includes(provider)
    ) {
      throw new BadRequestException(
        `Unsupported integration provider "${provider}". Supported: ${SUPPORTED_COMPOSIO_PROVIDERS.join(', ')}`,
      );
    }

    if (!this.provider.isEnabled()) {
      throw new ServiceUnavailableException(
        'Integrations are not configured. Set COMPOSIO_API_KEY and INTEGRATION_PROVIDER=composio on the API server.',
      );
    }

    // Step 1: ensure DB row exists before the SDK call (idempotent)
    const existing = await this.prisma.integrationConnection.findFirst({
      where: { workspaceId, provider },
    });
    if (!existing) {
      await this.prisma.integrationConnection.create({
        data: {
          workspaceId,
          provider,
          composioEntityId: workspaceId,
          active: false,
        },
      });
    }

    // Step 2: call SDK — if this throws the row already exists for retry
    const { redirectUrl } = await this.provider.initiateConnect(
      workspaceId,
      provider,
    );

    return { redirectUrl };
  }

  // Task 5.2 — verified finalization with account status check
  async finalizeConnection(
    composioEntityId: string,
    provider?: string,
  ): Promise<{ status: 'connected' | 'pending' | 'error'; message?: string }> {
    let verifyStatus: ComposioAccountVerifyStatus = 'ACTIVE';

    if (provider && this.composioService.isEnabled()) {
      try {
        verifyStatus = await Promise.race([
          this.composioService.verifyConnectedAccount(
            composioEntityId,
            provider,
          ),
          new Promise<ComposioAccountVerifyStatus>((_, reject) =>
            setTimeout(
              () =>
                reject(new Error('verifyConnectedAccount timeout after 10s')),
              10_000,
            ),
          ),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `verifyConnectedAccount error entity=${composioEntityId}: ${message}`,
        );
        return { status: 'error', message };
      }
    }

    const where = provider
      ? { workspaceId: composioEntityId, provider }
      : { workspaceId: composioEntityId };

    if (verifyStatus === 'ACTIVE') {
      const count = await this.prisma.integrationConnection.count({ where });
      if (count === 0) {
        await this.prisma.integrationConnection.create({
          data: {
            workspaceId: composioEntityId,
            provider: provider ?? 'unknown',
            composioEntityId,
            active: true,
            metadata: { lastSyncError: null },
          },
        });
      } else {
        await this.prisma.integrationConnection.updateMany({
          where,
          data: { composioEntityId, active: true },
        });
      }
      return { status: 'connected' };
    }

    // Non-ACTIVE: leave active = false, record the status as an error
    const errorMsg = `Connection status: ${verifyStatus}`;
    const rows = await this.prisma.integrationConnection.findMany({ where });
    await Promise.all(
      rows.map((row) => {
        const meta = parseIntegrationMetadata(row.metadata);
        return this.prisma.integrationConnection.update({
          where: { id: row.id },
          data: {
            metadata: {
              ...meta,
              lastSyncError: errorMsg,
            },
          },
        });
      }),
    );
    return { status: 'pending', message: errorMsg };
  }

  private async recordSyncAttempt(
    connectionId: string,
    metadata: IntegrationConnectionMetadata,
    patch: IntegrationConnectionMetadata | null,
    responseId: string,
    error: string | null,
  ): Promise<void> {
    const merged: IntegrationConnectionMetadata = {
      ...metadata,
      ...(patch ?? {}),
      lastSyncAt: new Date().toISOString(),
      lastSyncError: error,
      lastSyncResponseId: responseId,
    };
    await this.prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { metadata: merged },
    });
  }

  /**
   * Fan-out only: enqueues one durable 'dispatch-connection' job per eligible
   * connection. Never throws and does no provider I/O, so the parent
   * 'responses' job can never re-run AI/webhook side effects because an
   * integration failed. Signature kept for response.processor.ts; `answers`
   * is unused — the dispatch job re-reads the payload from the DB.
   */
  async dispatchForResponse(
    formId: string,
    responseId: string,
    submittedAt: string,
    _answers: import('@prisma/client').Prisma.JsonValue,
  ): Promise<void> {
    if (!this.provider.isEnabled()) {
      this.logger.warn(
        'Integrations skipped: COMPOSIO_API_KEY or INTEGRATION_PROVIDER not configured',
      );
      return;
    }

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { workspaceId: true },
    });
    if (!form?.workspaceId) return;

    const connections = await this.prisma.integrationConnection.findMany({
      where: {
        workspaceId: form.workspaceId,
        active: true,
        composioEntityId: { not: null },
      },
      select: { id: true, metadata: true },
    });

    const eligible = connections.filter((conn) =>
      isFormEnabledForIntegration(
        parseIntegrationMetadata(conn.metadata),
        formId,
      ),
    );

    await Promise.allSettled(
      eligible.map((conn) =>
        this.integrationsQueue.add(
          'dispatch-connection',
          { connectionId: conn.id, formId, responseId, submittedAt },
          {
            // Dedupe when the parent 'responses' job retries.
            jobId: `intdispatch:${responseId}:${conn.id}`,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: { age: 86_400 },
            removeOnFail: { age: 604_800 },
          },
        ),
      ),
    );
  }

  /**
   * Dispatches one response to one connection. Runs on the 'integrations'
   * queue (concurrency 1 — serializes sheetsNextRow read-modify-write).
   * Throws retryable errors so BullMQ backs off and retries; throws
   * UnrecoverableError for config/auth failures so the queue stops.
   */
  async dispatchForConnection(data: {
    connectionId: string;
    formId: string;
    responseId: string;
    submittedAt: string;
  }): Promise<void> {
    const { connectionId, formId, responseId, submittedAt } = data;

    const conn = await this.prisma.integrationConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn?.active || !conn.composioEntityId) return;

    const metadata = parseIntegrationMetadata(conn.metadata);
    if (!isFormEnabledForIntegration(metadata, formId)) return;

    // Already synced this response (e.g. duplicate enqueue) — nothing to do.
    if (metadata.lastSyncResponseId === responseId && !metadata.lastSyncError) {
      return;
    }

    const [form, response] = await Promise.all([
      this.prisma.form.findUnique({
        where: { id: formId },
        select: { title: true, publishedSnapshot: true },
      }),
      this.prisma.formResponse.findUnique({
        where: { id: responseId },
        select: { payload: true },
      }),
    ]);
    if (!form || !response) return;

    const dispatchMetadata: IntegrationConnectionMetadata = {
      ...metadata,
      spreadsheetId: resolveSpreadsheetId(metadata, formId),
      slackChannel: resolveSlackChannel(metadata, formId),
    };

    if (conn.provider === 'google_sheets' && !dispatchMetadata.spreadsheetId) {
      await this.recordSyncAttempt(
        conn.id,
        metadata,
        null,
        responseId,
        'spreadsheetId not configured for this form',
      );
      throw new UnrecoverableError(
        'spreadsheetId not configured for this form',
      );
    }

    if (
      conn.provider === 'notion' &&
      !resolveNotionDatabaseId(metadata, formId)
    ) {
      await this.recordSyncAttempt(
        conn.id,
        metadata,
        null,
        responseId,
        'Notion database not configured for this form',
      );
      throw new UnrecoverableError(
        'Notion database not configured for this form',
      );
    }

    try {
      const patch = await this.provider.dispatchOnResponse(
        conn.composioEntityId,
        conn.provider,
        {
          formId,
          formTitle: form.title,
          responseId,
          submittedAt,
          answers: parseFormAnswersPayload(response.payload),
          publishedSnapshot: parsePublishedSnapshot(form.publishedSnapshot),
          metadata: dispatchMetadata,
        },
      );
      await this.recordSyncAttempt(conn.id, metadata, patch, responseId, null);
    } catch (err) {
      const kind = classifyDispatchError(err);
      const message = err instanceof Error ? err.message : String(err);

      if (kind === 'auth') {
        const status = await this.composioService.verifyConnectedAccount(
          conn.composioEntityId,
          conn.provider,
        );
        if (status === 'EXPIRED' || status === 'FAILED') {
          await this.prisma.integrationConnection.update({
            where: { id: conn.id },
            data: { active: false },
          });
          await this.recordSyncAttempt(
            conn.id,
            metadata,
            null,
            responseId,
            `Connection ${status.toLowerCase()} — reconnect ${conn.provider} from Manage integrations`,
          );
          throw new UnrecoverableError(`connection ${status}: ${message}`);
        }
      }

      await this.recordSyncAttempt(
        conn.id,
        metadata,
        null,
        responseId,
        message,
      );

      if (kind === 'permanent') {
        throw new UnrecoverableError(message);
      }
      throw err instanceof Error ? err : new Error(message);
    }
  }

  /** Append a test row to verify Google Sheets connectivity. */
  async testSheet(
    workspaceId: string,
    integrationId: string,
    userId: string,
    formId?: string,
  ) {
    await this.assertWorkspaceOwner(workspaceId, userId);

    const conn = await this.prisma.integrationConnection.findFirst({
      where: { id: integrationId, workspaceId, provider: 'google_sheets' },
    });
    if (!conn?.composioEntityId) {
      throw new NotFoundException('Google Sheets integration not found');
    }
    if (!conn.active) {
      throw new BadRequestException('Google Sheets integration is not active');
    }

    const metadata = parseIntegrationMetadata(conn.metadata);
    const targetFormId = formId?.trim();
    const spreadsheetId = targetFormId
      ? resolveSpreadsheetId(metadata, targetFormId)
      : metadata.spreadsheetId;
    if (!spreadsheetId) {
      throw new BadRequestException(
        'Set spreadsheetId on the integration (or per-form override) before testing.',
      );
    }

    let formTitle = 'Clearform test';
    let publishedSnapshot = null;
    if (targetFormId) {
      const form = await this.prisma.form.findFirst({
        where: { id: targetFormId, workspaceId },
        select: { title: true, publishedSnapshot: true },
      });
      if (!form)
        throw new NotFoundException('Form not found in this workspace');
      formTitle = form.title;
      publishedSnapshot = parsePublishedSnapshot(form.publishedSnapshot);
    }

    const testResponseId = `test-${Date.now()}`;
    const submittedAt = new Date().toISOString();

    try {
      const patch = await this.provider.dispatchOnResponse(
        conn.composioEntityId,
        'google_sheets',
        {
          formId: targetFormId ?? 'test-form',
          formTitle,
          responseId: testResponseId,
          submittedAt,
          answers: { answersByScreenId: {} },
          publishedSnapshot,
          metadata: {
            ...metadata,
            spreadsheetId,
          },
        },
      );
      await this.recordSyncAttempt(
        conn.id,
        metadata,
        patch,
        testResponseId,
        null,
      );
      return {
        ok: true,
        testResponseId,
        spreadsheetId,
        message: 'Test row appended to Google Sheet.',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.recordSyncAttempt(
        conn.id,
        metadata,
        null,
        testResponseId,
        message,
      );
      throw new BadRequestException(`Google Sheets test failed: ${message}`);
    }
  }

  // Task 8.1 + 8.2 — enablement guard first, partial-failure response shape
  async syncHistoricalToSheets(
    workspaceId: string,
    integrationId: string,
    userId: string,
    formId: string,
  ): Promise<{
    synced: number;
    total: number;
    formId: string;
    error?: string;
  }> {
    await this.assertWorkspaceOwner(workspaceId, userId);

    const conn = await this.prisma.integrationConnection.findFirst({
      where: {
        id: integrationId,
        workspaceId,
        provider: 'google_sheets',
        active: true,
      },
    });
    if (!conn?.composioEntityId) {
      throw new NotFoundException('Active Google Sheets integration not found');
    }

    const metadata = parseIntegrationMetadata(conn.metadata);

    // Task 8.1 — check form enablement before any other guard
    if (!isFormEnabledForIntegration(metadata, formId)) {
      throw new BadRequestException(
        'This form is not enabled for this integration.',
      );
    }

    const spreadsheetId = resolveSpreadsheetId(metadata, formId);
    if (!spreadsheetId) {
      throw new BadRequestException(
        'Set spreadsheetId on the integration before syncing.',
      );
    }

    const form = await this.prisma.form.findFirst({
      where: { id: formId, workspaceId },
      select: { title: true, publishedSnapshot: true },
    });
    if (!form) throw new NotFoundException('Form not found in this workspace');

    const responses = await this.prisma.formResponse.findMany({
      where: { formId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, payload: true },
    });

    const total = responses.length;
    let synced = 0;
    let workingMetadata = metadata;
    const publishedSnapshot = parsePublishedSnapshot(form.publishedSnapshot);

    for (const row of responses) {
      const submittedAt = row.createdAt.toISOString();
      try {
        const patch = await this.provider.dispatchOnResponse(
          conn.composioEntityId,
          'google_sheets',
          {
            formId,
            formTitle: form.title,
            responseId: row.id,
            submittedAt,
            answers: parseFormAnswersPayload(row.payload),
            publishedSnapshot,
            metadata: {
              ...workingMetadata,
              spreadsheetId,
            },
          },
        );
        await this.recordSyncAttempt(
          conn.id,
          workingMetadata,
          patch,
          row.id,
          null,
        );
        workingMetadata = {
          ...workingMetadata,
          ...(patch ?? {}),
          lastSyncAt: new Date().toISOString(),
          lastSyncError: null,
          lastSyncResponseId: row.id,
        };
        synced += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.recordSyncAttempt(
          conn.id,
          workingMetadata,
          null,
          row.id,
          message,
        );
        // Task 8.2 — return partial-success shape instead of re-throwing
        return { synced, total, formId, error: message };
      }
    }

    return { synced, total, formId };
  }

  // Task 7.1 — title truncation to 100 chars before suffix
  async createFormSheet(
    formId: string,
    userId: string,
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    if (!this.provider.isEnabled()) {
      throw new ServiceUnavailableException(
        'Google Sheets integration is not configured. Set COMPOSIO_API_KEY and INTEGRATION_PROVIDER=composio on the API server.',
      );
    }
    if (!this.provider.createSpreadsheet) {
      throw new ServiceUnavailableException(
        'createSpreadsheet is not supported by the current integration provider.',
      );
    }

    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      select: { title: true, workspaceId: true },
    });
    if (!form?.workspaceId) throw new NotFoundException('Form not found');

    const conn = await this.prisma.integrationConnection.findFirst({
      where: {
        workspaceId: form.workspaceId,
        provider: 'google_sheets',
        active: true,
        composioEntityId: { not: null },
      },
    });
    if (!conn?.composioEntityId) {
      throw new NotFoundException(
        'No active Google Sheets connection found for this workspace. Connect Google Sheets first.',
      );
    }

    // Task 7.1 — truncate title to max 100 chars before appending suffix
    const truncatedTitle = form.title.slice(0, 100);
    const title = `${truncatedTitle} — Clearform Responses`;

    const { spreadsheetId } = await this.provider.createSpreadsheet(
      conn.composioEntityId,
      title,
    );

    const existingMeta = parseIntegrationMetadata(conn.metadata);
    const updatedMeta: IntegrationConnectionMetadata = {
      ...existingMeta,
      formSpreadsheetIds: {
        ...(existingMeta.formSpreadsheetIds ?? {}),
        [formId]: spreadsheetId,
      },
    };
    await this.prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { metadata: updatedMeta },
    });

    return {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  }

  /**
   * Creates a per-form Notion database (schema matching our dispatch
   * properties) under the given parent page and stores its id in
   * formNotionDatabaseIds — mirrors createFormSheet.
   */
  async createFormNotionDatabase(
    formId: string,
    userId: string,
    parentPageId: string,
  ): Promise<{ databaseId: string; databaseUrl: string }> {
    if (!this.provider.isEnabled()) {
      throw new ServiceUnavailableException(
        'Notion integration is not configured. Set COMPOSIO_API_KEY and INTEGRATION_PROVIDER=composio on the API server.',
      );
    }
    const trimmedParent = parentPageId?.trim();
    if (!trimmedParent) {
      throw new BadRequestException(
        'parentPageId is required — paste the Notion page the database should live under.',
      );
    }

    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      select: {
        title: true,
        workspaceId: true,
        publishedSnapshot: true,
        builderSnapshot: true,
      },
    });
    if (!form?.workspaceId) throw new NotFoundException('Form not found');

    const conn = await this.prisma.integrationConnection.findFirst({
      where: {
        workspaceId: form.workspaceId,
        provider: 'notion',
        active: true,
        composioEntityId: { not: null },
      },
    });
    if (!conn?.composioEntityId) {
      throw new NotFoundException(
        'No active Notion connection found for this workspace. Connect Notion first.',
      );
    }

    const { buildResponseColumns } =
      await import('../responses/response-row-builder');
    const columns = buildResponseColumns(
      form.publishedSnapshot ?? form.builderSnapshot,
    );

    const truncatedTitle = form.title.slice(0, 100);
    const title = `${truncatedTitle} — Clearform Responses`;

    const { databaseId } = await this.composioService.createNotionDatabase(
      conn.composioEntityId,
      title,
      trimmedParent,
      columns.map((c) => c.header),
    );

    const existingMeta = parseIntegrationMetadata(conn.metadata);
    const updatedMeta: IntegrationConnectionMetadata = {
      ...existingMeta,
      formNotionDatabaseIds: {
        ...(existingMeta.formNotionDatabaseIds ?? {}),
        [formId]: databaseId,
      },
    };
    await this.prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { metadata: updatedMeta },
    });

    return {
      databaseId,
      databaseUrl: `https://www.notion.so/${databaseId.replace(/-/g, '')}`,
    };
  }

  // Task 9.1 — clean up all per-form metadata references within a Prisma transaction
  async cleanupFormFromIntegrations(
    formId: string,
    workspaceId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const connections = await tx.integrationConnection.findMany({
      where: { workspaceId },
      select: { id: true, metadata: true },
    });

    for (const conn of connections) {
      const meta = parseIntegrationMetadata(conn.metadata);

      const hasSpreadsheetRef = meta.formSpreadsheetIds?.[formId] !== undefined;
      const hasSlackRef = meta.formSlackChannels?.[formId] !== undefined;
      const hasNotionRef = meta.formNotionDatabaseIds?.[formId] !== undefined;
      const hasEnabledRef = meta.enabledFormIds?.includes(formId) ?? false;

      if (
        !hasSpreadsheetRef &&
        !hasSlackRef &&
        !hasNotionRef &&
        !hasEnabledRef
      ) {
        continue; // row does not reference this form — leave untouched
      }

      const newFormSpreadsheetIds = hasSpreadsheetRef
        ? Object.fromEntries(
            Object.entries(meta.formSpreadsheetIds ?? {}).filter(
              ([k]) => k !== formId,
            ),
          )
        : meta.formSpreadsheetIds;

      const newFormSlackChannels = hasSlackRef
        ? Object.fromEntries(
            Object.entries(meta.formSlackChannels ?? {}).filter(
              ([k]) => k !== formId,
            ),
          )
        : meta.formSlackChannels;

      const newFormNotionDatabaseIds = hasNotionRef
        ? Object.fromEntries(
            Object.entries(meta.formNotionDatabaseIds ?? {}).filter(
              ([k]) => k !== formId,
            ),
          )
        : meta.formNotionDatabaseIds;

      const newEnabledFormIds = hasEnabledRef
        ? (meta.enabledFormIds ?? []).filter((id) => id !== formId)
        : meta.enabledFormIds;

      const updatedMeta: IntegrationConnectionMetadata = {
        ...meta,
        formSpreadsheetIds: newFormSpreadsheetIds,
        formSlackChannels: newFormSlackChannels,
        formNotionDatabaseIds: newFormNotionDatabaseIds,
        enabledFormIds: newEnabledFormIds,
      };

      await tx.integrationConnection.update({
        where: { id: conn.id },
        data: { metadata: updatedMeta },
      });
    }
  }
}

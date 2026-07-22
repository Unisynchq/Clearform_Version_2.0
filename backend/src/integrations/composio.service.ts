import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Composio } from '@composio/core';
import * as Sentry from '@sentry/nestjs';
import {
  buildComposioOAuthCallbackUrl,
  resolveComposioAuthConfigId,
} from './composio-auth-config.util';
import { toComposioHttpException } from './composio-error.util';
import { resolveComposioOAuthCallbackUrl } from './composio-oauth.util';
import {
  buildSheetsAppendPlan,
  buildSheetsColumnsFromSnapshot,
  buildSheetsDataRow,
} from './composio-sheets-rows.util';
import {
  buildResponseCells,
  cellTextWithLinks,
} from '../responses/response-row-builder';
import {
  buildAnswersFromSnapshot,
  parseSnapshotScreens,
} from '../responses/answer-format.util';
import {
  resolveNotionDatabaseId,
  resolveSlackChannel,
} from './integration-metadata.util';
import type {
  ComposioAccountVerifyStatus,
  FormAnswersPayload,
  FormPublishedSnapshot,
  IntegrationConnectionMetadata,
  SheetsDispatchMetadataPatch,
} from './integration-types';

/**
 * Workspace connect + response dispatch providers (CLE-19).
 *
 * ── Adding a new provider (the extension recipe) ─────────────────────────────
 * 1. Add the slug here, to PROVIDER_ACTION_MAP, and to PROVIDER_TOOLKIT_SLUG
 *    (both this file and composio-auth-config.util.ts, incl. its
 *    AUTH_CONFIG_ENV_KEYS entry, e.g. COMPOSIO_AUTH_CONFIG_<PROVIDER>).
 * 2. Add a dispatch branch in dispatchAction below building the provider's
 *    tools.execute arguments — reuse the shared response-row-builder so
 *    outputs match exports/sheets.
 * 3. Per-form target config: add a metadata map + resolver in
 *    integration-types.ts / integration-metadata.util.ts, thread it through
 *    IntegrationsService (dispatchForConnection + cleanupFormFromIntegrations).
 * 4. Composio dashboard: enable the toolkit and create an auth config
 *    (custom OAuth credentials — managed auth is being retired mid-2026).
 * 5. Frontend: add the provider slug in integrationsService.js and a card in
 *    ManageIntegrationsModal.jsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SUPPORTED_COMPOSIO_PROVIDERS = [
  'google_sheets',
  'slack',
  'google_drive',
  'notion',
] as const;

export type ComposioProviderSlug =
  (typeof SUPPORTED_COMPOSIO_PROVIDERS)[number];

// Composio action slugs per provider (v3 @composio/core tools.execute)
const PROVIDER_ACTION_MAP: Record<ComposioProviderSlug, string> = {
  google_sheets: 'GOOGLESHEETS_BATCH_UPDATE_VALUES',
  slack: 'SLACK_SENDS_A_MESSAGE',
  google_drive: 'GOOGLEDRIVE_CREATE_FILE',
  notion: 'NOTION_INSERT_ROW_DATABASE',
};

const NOTION_CREATE_DATABASE_ACTION = 'NOTION_CREATE_DATABASE';

// Task 3.1 — toolkit slugs used when matching connectedAccounts by provider
const PROVIDER_TOOLKIT_SLUG: Record<ComposioProviderSlug, string> = {
  google_sheets: 'googlesheets',
  slack: 'slack',
  google_drive: 'googledrive',
  notion: 'notion',
};

/** Notion caps a rich_text item at 2000 chars. */
const NOTION_TEXT_LIMIT = 1_900;

function isSupportedProvider(
  provider: string,
): provider is ComposioProviderSlug {
  return (SUPPORTED_COMPOSIO_PROVIDERS as readonly string[]).includes(provider);
}

function buildSlackResponseMessage(payload: {
  formTitle: string;
  formId: string;
  responseId: string;
  submittedAt: string;
  answers: FormAnswersPayload;
  publishedSnapshot?: FormPublishedSnapshot | null;
  appUrl: string;
}): string {
  const screens = parseSnapshotScreens(payload.publishedSnapshot).filter(
    (s) => s.type === 'content' && s.id != null,
  );
  const answersMap =
    (payload.answers.answersByScreenId as Record<string, unknown> | undefined) ??
    {};
  const pairs = buildAnswersFromSnapshot(screens, answersMap).slice(0, 5);

  const lines = [
    `*New response on "${payload.formTitle}"*`,
    `Response ID: \`${payload.responseId}\``,
    `Submitted: ${payload.submittedAt}`,
    '',
  ];

  if (pairs.length > 0) {
    lines.push('*Answers:*');
    for (const pair of pairs) {
      lines.push(`• *${pair.label}:* ${pair.value}`);
    }
    lines.push('');
  }

  lines.push(
    `<${payload.appUrl}/dashboard/analytics?form=${payload.formId}|View in Clearform →>`,
  );

  return lines.join('\n');
}

@Injectable()
export class ComposioService {
  private readonly logger = new Logger(ComposioService.name);
  /** v3 SDK — used for both OAuth connect and action dispatch */
  private composioV3: Composio | null = null;
  private readonly oauthCallbackBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.oauthCallbackBaseUrl = resolveComposioOAuthCallbackUrl(config);
    const apiKey = config.get<string>('COMPOSIO_API_KEY');
    if (!apiKey?.trim()) {
      this.logger.warn(
        'COMPOSIO_API_KEY not set — Composio integrations disabled',
      );
      return;
    }
    const key = apiKey.trim();
    this.composioV3 = new Composio({ apiKey: key });
    this.logger.log(
      `Composio v3 client ready (OAuth callback base: ${this.oauthCallbackBaseUrl})`,
    );
  }

  isEnabled(): boolean {
    return !!this.composioV3;
  }

  getOAuthCallbackUrl(): string {
    return this.oauthCallbackBaseUrl;
  }

  // Task 3.2 — verify connected account status via Composio SDK
  // Returns FAILED on any error or missing account — never throws.
  async verifyConnectedAccount(
    entityId: string,
    provider: string,
  ): Promise<ComposioAccountVerifyStatus> {
    if (!this.composioV3) return 'FAILED';

    try {
      const toolkit =
        PROVIDER_TOOLKIT_SLUG[provider as ComposioProviderSlug] ?? provider;

      // Composio v3 SDK uses userIds[] + toolkitSlugs[] — entityId is the userId in this context.
      const accounts = await this.composioV3.connectedAccounts.list({
        userIds: [entityId],
        toolkitSlugs: [toolkit],
      });
      const items = (accounts as { items?: unknown[] }).items ?? [];
      const match = (items as Array<{ appName?: string; toolkitSlug?: string; status?: string }>)[0];

      if (!match) return 'FAILED';

      const status = String(match.status ?? '').toUpperCase();
      if (status === 'ACTIVE') return 'ACTIVE';
      if (status === 'INITIATED') return 'INITIATED';
      if (status === 'EXPIRED') return 'EXPIRED';
      return 'FAILED';
    } catch (err) {
      this.logger.warn(
        `verifyConnectedAccount failed entity=${entityId} provider=${provider}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return 'FAILED';
    }
  }

  /**
   * Initiates OAuth for a provider and returns the redirect URL to send the user to.
   * userId is a stable per-workspace identifier (workspaceId).
   */
  async initiateConnection(
    entityId: string,
    provider: string,
  ): Promise<string> {
    if (!this.composioV3) {
      throw new ServiceUnavailableException(
        'Integrations are not configured. Set COMPOSIO_API_KEY on the API server.',
      );
    }
    if (!isSupportedProvider(provider)) {
      throw new BadRequestException(
        `Unsupported integration provider "${provider}". Supported: ${SUPPORTED_COMPOSIO_PROVIDERS.join(', ')}`,
      );
    }

    this.logger.log(
      `Initiating Composio OAuth (v3 link) provider=${provider} userId=${entityId}`,
    );

    try {
      const authConfigId = await resolveComposioAuthConfigId(
        this.composioV3,
        this.config,
        provider,
      );
      const callbackUrl = buildComposioOAuthCallbackUrl(
        this.oauthCallbackBaseUrl,
        entityId,
        provider,
      );

      const connectionRequest = await this.composioV3.connectedAccounts.link(
        entityId,
        authConfigId,
        { callbackUrl },
      );

      const redirectUrl = connectionRequest.redirectUrl;
      if (!redirectUrl) {
        throw new BadRequestException(
          'Composio did not return an OAuth redirect URL. Check auth config and toolkit setup in the Composio dashboard.',
        );
      }
      return redirectUrl;
    } catch (err) {
      this.logger.warn(
        `Composio link failed provider=${provider} userId=${entityId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw toComposioHttpException(err);
    }
  }

  /**
   * Fires the appropriate Composio action for a provider when a form response is submitted.
   * Uses the v3 @composio/core SDK (tools.execute) — no legacy composio-core dependency.
   */
  async dispatchAction(
    entityId: string,
    provider: string,
    payload: {
      formId: string;
      formTitle: string;
      responseId: string;
      submittedAt: string;
      answers: FormAnswersPayload;
      publishedSnapshot?: FormPublishedSnapshot | null;
      metadata?: IntegrationConnectionMetadata;
    },
  ): Promise<SheetsDispatchMetadataPatch | null> {
    if (!this.composioV3) return null;

    const actionName = isSupportedProvider(provider)
      ? PROVIDER_ACTION_MAP[provider]
      : undefined;
    if (!actionName) {
      this.logger.warn(`No Composio action mapped for provider: ${provider}`);
      return null;
    }

    try {
      let actionArgs: Record<string, unknown>;
      let sheetsResult: SheetsDispatchMetadataPatch | null = null;

      if (provider === 'slack') {
        const channel = resolveSlackChannel(
          payload.metadata ?? {},
          payload.formId,
        );
        const appUrl =
          this.config.get<string>('APP_URL') ?? 'https://app.clearform.in';
        const text = buildSlackResponseMessage({
          formTitle: payload.formTitle,
          formId: payload.formId,
          responseId: payload.responseId,
          submittedAt: payload.submittedAt,
          answers: payload.answers,
          publishedSnapshot: payload.publishedSnapshot,
          appUrl,
        });
        actionArgs = { channel, text };
      } else if (provider === 'google_sheets') {
        const spreadsheetId = payload.metadata?.spreadsheetId as
          | string
          | undefined;
        const sheetRange =
          (payload.metadata?.sheetRange as string) ?? 'Sheet1!A1';
        if (!spreadsheetId) {
          this.logger.warn(
            `google_sheets integration missing spreadsheetId formId=${payload.formId} entity=${entityId}`,
          );
          return null;
        }

        const sheetTab = sheetRange.split('!')[0] || 'Sheet1';
        const columns = buildSheetsColumnsFromSnapshot(payload.publishedSnapshot);
        const dataRow = buildSheetsDataRow(payload.publishedSnapshot, columns, {
          responseId: payload.responseId,
          submittedAt: payload.submittedAt,
          answers: payload.answers,
        });
        const plan = buildSheetsAppendPlan(payload.metadata, columns, dataRow);
        const colCount = Math.max(plan.values[0]?.length ?? 1, 1);
        const endCol = columnIndexToLetter(colCount);
        const endRow = plan.startRow + plan.values.length - 1;
        const range = `${sheetTab}!A${plan.startRow}:${endCol}${endRow}`;

        actionArgs = {
          spreadsheet_id: spreadsheetId,
          range,
          value_input_option: 'USER_ENTERED',
          values: plan.values,
        };
        sheetsResult = {
          sheetsHeaderWritten: true,
          sheetsNextRow: endRow + 1,
          sheetsColumnCount: plan.columnCount,
        };
      } else if (provider === 'google_drive') {
        actionArgs = {
          name: `response-${payload.responseId}.json`,
          mimeType: 'application/json',
          content: JSON.stringify({
            formId: payload.formId,
            responseId: payload.responseId,
            submittedAt: payload.submittedAt,
            answers: payload.answers,
          }),
        };
      } else if (provider === 'notion') {
        const databaseId = resolveNotionDatabaseId(
          payload.metadata ?? {},
          payload.formId,
        );
        if (!databaseId) {
          this.logger.warn(
            `notion integration missing databaseId formId=${payload.formId} entity=${entityId}`,
          );
          return null;
        }

        const columns = buildSheetsColumnsFromSnapshot(payload.publishedSnapshot);
        const cells = buildResponseCells(
          payload.publishedSnapshot,
          columns,
          payload.answers,
        );
        const properties: Array<{ name: string; type: string; value: string }> =
          [
            { name: 'Response ID', type: 'title', value: payload.responseId },
            { name: 'Submitted At', type: 'date', value: payload.submittedAt },
            ...columns.map((col, i) => ({
              name: col.header,
              type: 'rich_text',
              value: cellTextWithLinks(cells[i]).slice(0, NOTION_TEXT_LIMIT),
            })),
          ];

        actionArgs = { database_id: databaseId, properties };
      } else {
        return null;
      }

      const result = await this.composioV3.tools.execute(actionName, {
        userId: entityId,
        dangerouslySkipVersionCheck: true,
        arguments: actionArgs,
      });

      if (!result.successful) {
        throw new Error(result.error ?? `Composio ${actionName} failed`);
      }

      this.logger.log(
        `Composio ${provider} action dispatched formId=${payload.formId} responseId=${payload.responseId} entity=${entityId}`,
      );
      return sheetsResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Composio dispatch failed provider=${provider} formId=${payload.formId} responseId=${payload.responseId} entity=${entityId}: ${message}`,
      );
      if (process.env.SENTRY_DSN?.trim()) {
        Sentry.captureException(err, {
          tags: { service: 'clearform-api', subsystem: 'composio' },
          extra: {
            provider,
            entityId,
            formId: payload.formId,
            responseId: payload.responseId,
          },
        });
      }
      throw err;
    }
  }

  /**
   * Creates a new Google Spreadsheet under the user's connected account and returns its ID.
   * Used by the auto-create-sheet endpoint so each form gets its own dedicated sheet.
   */
  async createSpreadsheet(
    entityId: string,
    title: string,
  ): Promise<{ spreadsheetId: string }> {
    if (!this.composioV3) {
      throw new BadRequestException(
        'Google Sheets integration is not configured. Set COMPOSIO_API_KEY on the API server.',
      );
    }
    try {
      const result = await this.composioV3.tools.execute(
        'GOOGLESHEETS_CREATE_SPREADSHEET',
        {
          userId: entityId,
          dangerouslySkipVersionCheck: true,
          arguments: { title },
        },
      );
      if (!result.successful) {
        throw new Error(result.error ?? 'Composio create spreadsheet failed');
      }
      const spreadsheetId =
        (result.data?.spreadsheetId as string | undefined) ??
        (result.data?.id as string | undefined);
      if (!spreadsheetId || typeof spreadsheetId !== 'string') {
        throw new Error(
          `Composio did not return a spreadsheetId. Response: ${JSON.stringify(result.data).slice(0, 200)}`,
        );
      }
      this.logger.log(
        `Created spreadsheet "${title}" spreadsheetId=${spreadsheetId} entity=${entityId}`,
      );
      return { spreadsheetId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `createSpreadsheet failed entity=${entityId}: ${message}`,
      );
      throw toComposioHttpException(err);
    }
  }

  /**
   * Creates a per-form Notion database (as a subpage of parentPageId) whose
   * schema matches our dispatch properties: title=Response ID, date=Submitted
   * At, one rich_text per question column.
   */
  async createNotionDatabase(
    entityId: string,
    title: string,
    parentPageId: string,
    questionHeaders: string[],
  ): Promise<{ databaseId: string }> {
    if (!this.composioV3) {
      throw new BadRequestException(
        'Notion integration is not configured. Set COMPOSIO_API_KEY on the API server.',
      );
    }
    try {
      const result = await this.composioV3.tools.execute(
        NOTION_CREATE_DATABASE_ACTION,
        {
          userId: entityId,
          dangerouslySkipVersionCheck: true,
          arguments: {
            parent_id: parentPageId,
            title,
            properties: [
              { name: 'Response ID', type: 'title' },
              { name: 'Submitted At', type: 'date' },
              ...questionHeaders.map((name) => ({ name, type: 'rich_text' })),
            ],
          },
        },
      );
      if (!result.successful) {
        throw new Error(result.error ?? 'Composio create Notion database failed');
      }
      const data = result.data as
        | { database_id?: string; id?: string; data?: { id?: string } }
        | undefined;
      const databaseId = data?.database_id ?? data?.id ?? data?.data?.id;
      if (!databaseId || typeof databaseId !== 'string') {
        throw new Error(
          `Composio did not return a Notion database id. Response: ${JSON.stringify(result.data).slice(0, 200)}`,
        );
      }
      this.logger.log(
        `Created Notion database "${title}" databaseId=${databaseId} entity=${entityId}`,
      );
      return { databaseId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `createNotionDatabase failed entity=${entityId}: ${message}`,
      );
      throw toComposioHttpException(err);
    }
  }
}

function columnIndexToLetter(count: number): string {
  let n = Math.max(1, count);
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

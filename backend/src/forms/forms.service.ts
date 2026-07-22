import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormStatus, Prisma, ResponseStatus } from '@prisma/client';
import { snapshotTitle, validateSnapshotStructure } from './snapshot.validator';
import { ConfigService } from '@nestjs/config';
import { buildPublicFormUrl } from '../common/utils/public-form-url';
import { WebhooksService } from '../webhooks/webhooks.service';
import { buildFormPublishedPayload } from '../webhooks/webhook-payload.util';
import { evictAnalyticsCaches } from '../common/analytics-cache.util';
import { REDIS_KEYS, REDIS_TTL } from '../common/redis-cache-keys';
import { purgePublishedFormCache } from '../common/cloudflare-purge.util';
import {
  safeRedisDel,
  safeRedisGet,
  safeRedisSet,
} from '../redis/redis-cache.util';
import { IntegrationsService } from '../integrations/integrations.service';
import { BillingService } from '../billing/billing.service';
import { FormQualityMemoryIndexer } from '../ai/form-quality-memory-indexer.service';

export type PublicFormRenderResult = {
  snapshot: object;
  publishedAt: string | null;
  etag: string;
};

type FormWithIncludes = Prisma.FormGetPayload<{
  include: { settings: true; _count: { select: { responses: true } } };
}>;

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  if (s < 2592000) return `${Math.floor(s / 604800)}w ago`;
  return `${Math.floor(s / 2592000)}mo ago`;
}

function serializeForm(form: FormWithIncludes) {
  const { _count, workspaceId, ...rest } = form;
  return {
    ...rest,
    status: form.status.toLowerCase(),
    workspace: workspaceId ?? null,
    responses: _count.responses,
    timeAgo: timeAgo(new Date(form.updatedAt)),
  };
}

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly webhooksService: WebhooksService,
    // Task 10.1 — inject IntegrationsService for cleanup on hard delete
    private readonly integrationsService: IntegrationsService,
    private readonly billingService: BillingService,
    private readonly qualityMemoryIndexer: FormQualityMemoryIndexer,
  ) {}

  private async resolveWorkspaceId(
    workspaceId: string | undefined,
    userId: string,
  ): Promise<string | undefined> {
    if (!workspaceId) return undefined;
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId: userId },
      select: { id: true },
    });
    if (workspace) return workspace.id;
    this.logger.warn(
      `Ignoring unknown workspaceId "${workspaceId}" for user ${userId}`,
    );
    return undefined;
  }

  private renderCacheKey(id: string) {
    return REDIS_KEYS.formRender(id);
  }

  private buildRenderEtag(formId: string, publishedAt: string | null): string {
    const version = publishedAt ?? 'none';
    return `"${formId}-${version}"`;
  }

  private async evictRenderCache(id: string): Promise<void> {
    await safeRedisDel(this.redis, this.renderCacheKey(id));
  }

  private async safeEvictRenderCache(id: string): Promise<void> {
    try {
      await this.evictRenderCache(id);
    } catch (err) {
      this.logger.warn(
        `Render cache evict failed for form ${id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private buildPublicUrl(formId: string): string {
    const origin =
      this.config.get<string>('PUBLIC_FORM_ORIGIN') ?? 'http://localhost:5173';
    return buildPublicFormUrl(origin, formId);
  }

  private isPublishedSnapshotPayload(value: unknown): value is object {
    return (
      value != null &&
      typeof value === 'object' &&
      Array.isArray((value as { screens?: unknown }).screens) &&
      (value as { screens: unknown[] }).screens.length > 0
    );
  }

  private normalizeRenderCacheEntry(
    parsed: unknown,
  ): { snapshot: object; publishedAt: string | null } | null {
    if (this.isPublishedSnapshotPayload(parsed)) {
      return { snapshot: parsed, publishedAt: null };
    }
    if (
      parsed != null &&
      typeof parsed === 'object' &&
      this.isPublishedSnapshotPayload(
        (parsed as { snapshot?: unknown }).snapshot,
      )
    ) {
      const entry = parsed as { snapshot: object; publishedAt?: string | null };
      return {
        snapshot: entry.snapshot,
        publishedAt: entry.publishedAt ?? null,
      };
    }
    return null;
  }

  private async readRenderCache(
    id: string,
  ): Promise<{ snapshot: object; publishedAt: string | null } | null> {
    try {
      const cached = await safeRedisGet(this.redis, this.renderCacheKey(id));
      if (!cached) return null;
      const parsed = JSON.parse(cached) as unknown;
      const entry = this.normalizeRenderCacheEntry(parsed);
      if (!entry) {
        await this.evictRenderCache(id);
        return null;
      }
      return entry;
    } catch (err) {
      this.logger.warn(
        `Render cache read failed for form ${id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private async writeRenderCache(
    id: string,
    snapshot: object,
    publishedAt: Date | null,
  ): Promise<void> {
    try {
      await safeRedisSet(
        this.redis,
        this.renderCacheKey(id),
        JSON.stringify({
          snapshot,
          publishedAt: publishedAt?.toISOString() ?? null,
        }),
        REDIS_TTL.formRenderSeconds,
      );
    } catch (err) {
      this.logger.warn(
        `Render cache write failed for form ${id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async renderFormPublic(id: string): Promise<PublicFormRenderResult> {
    const cached = await this.readRenderCache(id);
    if (cached) {
      return {
        snapshot: cached.snapshot,
        publishedAt: cached.publishedAt,
        etag: this.buildRenderEtag(id, cached.publishedAt),
      };
    }

    const form = await this.prisma.form.findUnique({
      where: { id },
      select: { status: true, publishedSnapshot: true, publishedAt: true },
    });

    if (!form || form.status !== FormStatus.LIVE) {
      throw new NotFoundException('Form not found or not live');
    }

    const snapshot = form.publishedSnapshot;
    if (!this.isPublishedSnapshotPayload(snapshot)) {
      throw new NotFoundException('Form not found or not live');
    }

    const publishedAt = form.publishedAt?.toISOString() ?? null;
    await this.writeRenderCache(id, snapshot, form.publishedAt);
    return {
      snapshot,
      publishedAt,
      etag: this.buildRenderEtag(id, publishedAt),
    };
  }

  /** @deprecated Use renderFormPublic — returns snapshot only for backward compatibility */
  async renderForm(id: string) {
    const { snapshot } = await this.renderFormPublic(id);
    return snapshot;
  }

  async create(createFormDto: CreateFormDto, userId: string) {
    const { workspaceId, ...formData } = createFormDto;
    const resolvedWorkspaceId = await this.resolveWorkspaceId(
      workspaceId,
      userId,
    );
    await this.billingService.assertCanCreateForm(userId, resolvedWorkspaceId);

    // Defense-in-depth against double-submit (double-click, client retry):
    // if this exact user just created a form with the same title in the
    // same workspace a moment ago, return that one instead of creating a
    // sibling duplicate. The frontend already guards against this, but the
    // backend had no protection at all.
    const recentDuplicate = await this.prisma.form.findFirst({
      where: {
        ownerId: userId,
        workspaceId: resolvedWorkspaceId,
        title: formData.title,
        createdAt: { gte: new Date(Date.now() - 5_000) },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    if (recentDuplicate) {
      return serializeForm(recentDuplicate);
    }

    const form = await this.prisma.form.create({
      data: {
        ...formData,
        workspaceId: resolvedWorkspaceId,
        ownerId: userId,
        settings: { create: {} },
      },
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    return serializeForm(form);
  }

  async findAll(
    userId: string,
    status?: FormStatus,
    workspaceId?: string,
    search?: string,
  ) {
    const where: Record<string, unknown> = { ownerId: userId };

    if (status) {
      where.status = status;
    } else {
      where.status = { notIn: [FormStatus.TRASH, FormStatus.ARCHIVED] };
    }

    if (workspaceId) where.workspaceId = workspaceId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const forms = await this.prisma.form.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    return forms.map(serializeForm);
  }

  private async findOneRaw(id: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id, ownerId: userId },
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async findOne(id: string, userId: string) {
    return serializeForm(await this.findOneRaw(id, userId));
  }

  async update(id: string, updateFormDto: UpdateFormDto, userId: string) {
    await this.findOneRaw(id, userId);
    const { workspaceId, ...rest } = updateFormDto;
    const data: Prisma.FormUpdateInput = { ...rest };
    if (workspaceId !== undefined) {
      if (!workspaceId) {
        data.workspace = { disconnect: true };
      } else {
        const resolved = await this.resolveWorkspaceId(workspaceId, userId);
        if (resolved) {
          data.workspace = { connect: { id: resolved } };
        }
      }
    }
    const updated = await this.prisma.form.update({
      where: { id },
      data,
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    await this.evictRenderCache(id);
    return serializeForm(updated);
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOneRaw(id, userId);
    await this.billingService.assertCanCreateForm(
      userId,
      original.workspaceId ?? undefined,
    );

    const copy = await this.prisma.form.create({
      data: {
        title: `${original.title} (Copy)`,
        workspaceId: original.workspaceId,
        gradientFrom: original.gradientFrom,
        gradientTo: original.gradientTo,
        overlayColor: original.overlayColor,
        iconGradient: original.iconGradient,
        ownerId: userId,
        status: FormStatus.DRAFT,
        settings: {
          create: original.settings
            ? {
                responseLimit: original.settings.responseLimit,
                notificationsEnabled: original.settings.notificationsEnabled,
                shareEnabled: original.settings.shareEnabled,
              }
            : {},
        },
      },
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    return serializeForm(copy);
  }

  async archive(id: string, userId: string) {
    const updated = await this.update(
      id,
      { status: FormStatus.ARCHIVED },
      userId,
    );
    await this.safeEvictRenderCache(id);
    return updated;
  }

  async remove(id: string, userId: string) {
    const form = await this.findOneRaw(id, userId);
    await this.safeEvictRenderCache(id);

    try {
      if (form.status === FormStatus.TRASH) {
        return await this.prisma.$transaction(async (tx) => {
          await tx.notification.deleteMany({ where: { formId: id } });
          // Task 10.2 — clean up per-form integration metadata before hard delete
          if (form.workspaceId) {
            await this.integrationsService.cleanupFormFromIntegrations(
              id,
              form.workspaceId,
              tx,
            );
          }
          return tx.form.delete({ where: { id } });
        });
      }
      return await this.prisma.form.update({
        where: { id },
        data: { status: FormStatus.TRASH },
      });
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      const msg = err instanceof Error ? err.message : String(err);
      if (code === 'ENOSPC' || /no space left on device/i.test(msg)) {
        throw new BadRequestException(
          'Server disk is full. Free VPS disk space (see scripts/vps-disk-cleanup.sh) and try again.',
        );
      }
      throw err;
    }
  }

  async publish(
    id: string,
    userId: string,
    snapshot?: Record<string, unknown>,
  ) {
    await this.findOneRaw(id, userId);
    if (!snapshot || Object.keys(snapshot).length === 0) {
      throw new BadRequestException(
        'Publish requires a form snapshot in the request body',
      );
    }

    try {
      validateSnapshotStructure(snapshot, { forPublish: true });
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw new UnprocessableEntityException(err.message);
      }
      throw err;
    }

    const savedAt = new Date();
    const title = snapshotTitle(snapshot);
    const data: Prisma.FormUpdateInput = {
      status: FormStatus.LIVE,
      publishedSnapshot: snapshot as Prisma.InputJsonValue,
      builderSnapshot: snapshot as Prisma.InputJsonValue,
      builderSnapshotVersion: { increment: 1 },
      publishedAt: savedAt,
      ...(title ? { title } : {}),
    };

    const updated = await this.prisma.form.update({
      where: { id },
      data,
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    await Promise.all([
      this.safeEvictRenderCache(id),
      evictAnalyticsCaches(this.redis, id),
    ]);
    const apiPublicUrl =
      this.config.get<string>('API_PUBLIC_URL') ?? 'https://api.clearform.in';
    void purgePublishedFormCache(apiPublicUrl, id);
    const publishedPayload = buildFormPublishedPayload({
      formId: id,
      formTitle: updated.title,
      publishedAt: savedAt.toISOString(),
    });
    await this.webhooksService
      .dispatchWebhooks(id, 'form.published', publishedPayload)
      .catch((err) =>
        this.logger.warn(
          `form.published webhooks failed for ${id}: ${String(err)}`,
        ),
      );
    void this.qualityMemoryIndexer
      .indexPublishedForm(id, snapshot)
      .catch((err) =>
        this.logger.warn(
          `question_pattern memory index failed for ${id}: ${String(err)}`,
        ),
      );
    return {
      ...serializeForm(updated),
      publicUrl: this.buildPublicUrl(id),
    };
  }

  async unpublish(id: string, userId: string) {
    await this.findOneRaw(id, userId);
    const updated = await this.prisma.form.update({
      where: { id },
      data: { status: FormStatus.DRAFT },
      include: {
        settings: true,
        _count: {
          select: {
            responses: { where: { status: { not: ResponseStatus.ABANDONED } } },
          },
        },
      },
    });
    await Promise.all([
      this.evictRenderCache(id),
      evictAnalyticsCaches(this.redis, id),
    ]);
    return serializeForm(updated);
  }

  async getSnapshot(id: string, userId: string) {
    const form = await this.findOneRaw(id, userId);
    return {
      snapshot: form.builderSnapshot,
      savedAt: form.updatedAt.toISOString(),
      version: form.builderSnapshotVersion,
    };
  }

  async saveSnapshot(
    id: string,
    snapshot: Record<string, unknown>,
    userId: string,
    expectedVersion?: number,
  ) {
    await this.findOneRaw(id, userId);
    if (!snapshot || typeof snapshot !== 'object') {
      throw new BadRequestException('Snapshot must be a JSON object');
    }

    try {
      validateSnapshotStructure(snapshot, { forPublish: false });
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw new UnprocessableEntityException(err.message);
      }
      throw err;
    }

    const savedAt = new Date();
    const title = snapshotTitle(snapshot);

    // Compare-and-swap: only apply this write if no newer autosave has
    // landed since the client last fetched/saved. Two overlapping autosave
    // requests can otherwise resolve out of order and silently revert a
    // newer edit — skip the write instead of clobbering it, and tell the
    // client its local version is stale so it can resync.
    if (typeof expectedVersion === 'number') {
      const result = await this.prisma.form.updateMany({
        where: { id, builderSnapshotVersion: expectedVersion },
        data: {
          builderSnapshot: snapshot as Prisma.InputJsonValue,
          builderSnapshotVersion: { increment: 1 },
          ...(title ? { title } : {}),
        },
      });
      if (result.count === 0) {
        const current = await this.prisma.form.findUnique({
          where: { id },
          select: { builderSnapshotVersion: true },
        });
        return {
          saved: false,
          conflict: true,
          version: current?.builderSnapshotVersion ?? expectedVersion,
        };
      }
      return {
        saved: true,
        savedAt: savedAt.toISOString(),
        version: expectedVersion + 1,
      };
    }

    const updated = await this.prisma.form.update({
      where: { id },
      data: {
        builderSnapshot: snapshot as Prisma.InputJsonValue,
        builderSnapshotVersion: { increment: 1 },
        ...(title ? { title } : {}),
      },
      select: { builderSnapshotVersion: true },
    });
    return {
      saved: true,
      savedAt: savedAt.toISOString(),
      version: updated.builderSnapshotVersion,
    };
  }
}

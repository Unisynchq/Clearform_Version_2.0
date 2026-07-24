import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, ResponseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import type { Redis } from 'ioredis';
import {
  REDIS_KEYS,
  REDIS_LIMITS,
  REDIS_TTL,
} from '../common/redis-cache-keys';
import { evictAnalyticsCaches } from '../common/analytics-cache.util';
import {
  safeRedisExpire,
  safeRedisLpush,
  safeRedisLrange,
  safeRedisLtrim,
} from '../redis/redis-cache.util';
import { normalizeCreateResponseBody } from './create-response-payload.util';
import {
  normalizeFormResponse,
  normalizeOwnerResponse,
} from './response-payload.normalizer';
import { BillingService } from '../billing/billing.service';

const PAGE_SIZE = 25;

function rangeCutoff(range?: string): Date | undefined {
  if (!range || range === 'all') return undefined;
  const days =
    range === '7d'
      ? 7
      : range === '30d'
        ? 30
        : range === '90d'
          ? 90
          : undefined;
  if (!days) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function durationMsFromPayload(
  payload: Record<string, unknown>,
): number | undefined {
  const metadata = payload.metadata;
  if (typeof metadata === 'object' && metadata !== null) {
    const meta = metadata as Record<string, unknown>;
    if (typeof meta.durationMs === 'number' && meta.durationMs >= 0) {
      return Math.round(meta.durationMs);
    }
    const startedAt = meta.startedAt;
    const submittedAt =
      payload.submittedAt ?? payload.submitted_at ?? meta.submittedAt;
    if (typeof startedAt === 'string' && typeof submittedAt === 'string') {
      const startMs = new Date(startedAt).getTime();
      const endMs = new Date(submittedAt).getTime();
      if (
        Number.isFinite(startMs) &&
        Number.isFinite(endMs) &&
        endMs >= startMs
      ) {
        return Math.round(endMs - startMs);
      }
    }
  }
  return undefined;
}

@Injectable()
export class ResponsesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue('responses') private readonly responseQueue: Queue,
    private readonly billingService: BillingService,
  ) {}

  async validateFormForFileUpload(formId: string): Promise<void> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { status: true },
    });

    if (!form) throw new NotFoundException('Form not found');

    if (form.status !== 'LIVE' && form.status !== 'DRAFT') {
      throw new BadRequestException('Form is not available');
    }
  }

  async validateSubmission(formId: string): Promise<void> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { settings: true },
    });

    if (!form) throw new NotFoundException('Form not found');

    if (form.status !== 'LIVE') {
      throw new BadRequestException('Form is not published');
    }

    if (
      form.settings?.pauseUntil &&
      new Date() < new Date(form.settings.pauseUntil)
    ) {
      throw new BadRequestException('Form is currently paused');
    }

    if (form.settings?.responseLimit) {
      const count = await this.prisma.formResponse.count({
        where: { formId, status: { not: ResponseStatus.ABANDONED } },
      });
      if (count >= form.settings.responseLimit) {
        throw new BadRequestException('Form has reached its response limit');
      }
    }
  }

  async pushRecentResponse(
    formId: string,
    normalized: ReturnType<typeof normalizeFormResponse>,
  ): Promise<void> {
    const key = REDIS_KEYS.formResponsesRecent(formId);
    await safeRedisLpush(this.redis, key, JSON.stringify(normalized));
    await safeRedisLtrim(
      this.redis,
      key,
      0,
      REDIS_LIMITS.formResponsesRecentMax - 1,
    );
    await safeRedisExpire(
      this.redis,
      key,
      REDIS_TTL.formResponsesRecentSeconds,
    );
  }

  async readRecentResponses(formId: string, limit = PAGE_SIZE) {
    const key = REDIS_KEYS.formResponsesRecent(formId);
    const raw = await safeRedisLrange(this.redis, key, 0, limit - 1);
    const items: ReturnType<typeof normalizeFormResponse>[] = [];
    for (const entry of raw) {
      try {
        items.push(
          JSON.parse(entry) as ReturnType<typeof normalizeFormResponse>,
        );
      } catch {
        /* skip corrupt cache entries */
      }
    }
    return items;
  }

  async submitResponse(
    formId: string,
    body: Record<string, unknown>,
    options?: { includePreview?: boolean },
  ) {
    await this.validateSubmission(formId);

    const { payload, submittedAt } = normalizeCreateResponseBody(body);
    const completed =
      payload.completed === true || payload.status === 'completed';

    if (completed) {
      await this.billingService.assertCanAcceptResponse(formId);
    }

    const created = await this.prisma.formResponse.create({
      data: {
        formId,
        payload: payload as Prisma.InputJsonValue,
        createdAt: new Date(submittedAt),
        status: 'PROCESSED',
        completedAt: completed ? new Date(submittedAt) : null,
        durationMs: durationMsFromPayload(payload),
      },
      select: {
        id: true,
        formId: true,
        payload: true,
        status: true,
        qualityScore: true,
        completedAt: true,
        createdAt: true,
      },
    });

    const formSnapshot = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { publishedSnapshot: true, builderSnapshot: true },
    });
    const snapshot =
      formSnapshot?.publishedSnapshot ?? formSnapshot?.builderSnapshot ?? null;
    const preview = normalizeFormResponse(created, snapshot);

    await this.pushRecentResponse(formId, preview);

    if (completed) {
      await this.billingService.incrementResponsesUsedForForm(formId);
    }

    // Invalidate analytics caches so dashboard and overlay reflect the new response immediately.
    void evictAnalyticsCaches(this.redis, formId);

    await this.responseQueue.add(
      'process-side-effects',
      {
        responseId: created.id,
        formId,
        payload,
        submittedAt,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );

    return {
      status: 'queued' as const,
      responseId: created.id,
      message: 'Response received and queued for processing.',
      ...(options?.includePreview ? { preview } : {}),
    };
  }

  async findAllPaginated(
    formId: string,
    userId: string,
    page = 1,
    range?: string,
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const cutoff = rangeCutoff(range);
    const where = {
      formId,
      ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
    };

    const formSnapshot = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { publishedSnapshot: true, builderSnapshot: true },
    });
    const snapshot =
      formSnapshot?.publishedSnapshot ?? formSnapshot?.builderSnapshot ?? null;

    const [rows, total] = await Promise.all([
      this.prisma.formResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      this.prisma.formResponse.count({ where }),
    ]);

    return {
      items: rows.map((r) => normalizeFormResponse(r, snapshot)),
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  async findOne(formId: string, responseId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const [response, formSnapshot] = await Promise.all([
      this.prisma.formResponse.findFirst({
        where: { id: responseId, formId },
      }),
      this.prisma.form.findUnique({
        where: { id: formId },
        select: { publishedSnapshot: true, builderSnapshot: true },
      }),
    ]);
    if (!response) throw new NotFoundException('Response not found');
    const snapshot =
      formSnapshot?.publishedSnapshot ?? formSnapshot?.builderSnapshot ?? null;
    return normalizeOwnerResponse(response, snapshot);
  }

  private rangeCutoff(range?: string): Date | null {
    const now = Date.now();
    switch (range) {
      case '7d':
        return new Date(now - 7 * 86_400_000);
      case '30d':
        return new Date(now - 30 * 86_400_000);
      case '90d':
        return new Date(now - 90 * 86_400_000);
      default:
        return null;
    }
  }

  private async loadExportData(formId: string, userId: string, range?: string) {
    const form = await this.prisma.form.findFirstOrThrow({
      where: { id: formId, ownerId: userId },
      select: { publishedSnapshot: true, builderSnapshot: true },
    });
    const cutoff = this.rangeCutoff(range);
    const responses = await this.prisma.formResponse.findMany({
      where: { formId, ...(cutoff ? { createdAt: { gte: cutoff } } : {}) },
      orderBy: { createdAt: 'asc' },
    });
    return {
      snapshot: form.publishedSnapshot ?? form.builderSnapshot,
      responses,
    };
  }

  async exportCsv(
    formId: string,
    userId: string,
    range?: string,
  ): Promise<string> {
    const { snapshot, responses } = await this.loadExportData(
      formId,
      userId,
      range,
    );
    const { buildResponsesCsv } = await import('./response-row-builder');
    return buildResponsesCsv(snapshot, responses);
  }

  async exportXlsx(
    formId: string,
    userId: string,
    range?: string,
  ): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx') as typeof import('xlsx');

    const { snapshot, responses } = await this.loadExportData(
      formId,
      userId,
      range,
    );
    const {
      buildResponseColumns,
      buildResponseRowForXlsx,
      RESPONSE_META_HEADERS,
    } = await import('./response-row-builder');

    const columns = buildResponseColumns(snapshot);
    const header = [...RESPONSE_META_HEADERS, ...columns.map((c) => c.header)];

    const rows = responses.map((r) =>
      buildResponseRowForXlsx(snapshot, columns, r),
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      header,
      ...rows.map((row) => row.values),
    ]);

    // File answers: clickable hyperlink on the cell (first file's URL).
    const metaCount = RESPONSE_META_HEADERS.length;
    rows.forEach((row, rowIdx) => {
      row.cells.forEach((cell, colIdx) => {
        if (cell.files.length === 0) return;
        const addr = XLSX.utils.encode_cell({
          r: rowIdx + 1,
          c: metaCount + colIdx,
        });
        if (ws[addr]) {
          ws[addr].l = {
            Target: cell.files[0].url,
            Tooltip: cell.files[0].name,
          };
        }
      });
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async getStatus(responseId: string, userId: string) {
    const response = await this.prisma.formResponse.findUnique({
      where: { id: responseId },
      include: { form: { select: { ownerId: true } } },
    });
    if (!response || response.form.ownerId !== userId) {
      throw new NotFoundException('Response not found');
    }
    return {
      id: response.id,
      status: response.status,
      qualityScore: response.qualityScore,
    };
  }
}

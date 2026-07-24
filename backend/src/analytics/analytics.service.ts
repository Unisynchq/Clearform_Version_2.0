import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import type { Redis } from 'ioredis';
import {
  normalizeAnswersFromPayload,
  normalizeFormResponse,
} from '../responses/response-payload.normalizer';
import { REDIS_KEYS, REDIS_TTL } from '../common/redis-cache-keys';
import {
  safeRedisGet,
  safeRedisLrange,
  safeRedisSet,
} from '../redis/redis-cache.util';
import { FormAiRateLimitService } from '../common/form-ai-rate-limit.service';
import { AiTierService } from '../ai/ai-tier.service';
import { buildInsightsReadyPayload } from './insights-payload.util';
import { InsightsGeneratorService } from './insights-generator.service';
import { BestResponsesRankerService } from './best-responses-ranker.service';
import { AiOrchestratorService } from '../ai/ai-orchestrator.service';
import { FormContextService } from '../ai/form-context.service';
import {
  computeScreenDropoff,
  contentScreenCountFromSnapshot,
  worstDropStep,
} from './analytics-snapshot.util';

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function deriveFunnelCounts(
  total: number,
  processed: number,
  completionRate: number,
) {
  // total = all sessions including abandoned; processed = only fully completed.
  // funnelStarted tracks users who began filling the form (includes abandoned).
  // funnelSubmitted tracks only completed submissions.
  const funnelSubmitted = processed;
  const funnelStarted = total;
  const funnelOpened = total;
  const funnelReached =
    completionRate > 0 && processed > 0
      ? Math.max(total, Math.ceil((processed * 100) / completionRate))
      : total;

  return {
    funnel: {
      reached: funnelReached,
      opened: funnelOpened,
      started: funnelStarted,
      submitted: funnelSubmitted,
    },
    funnelReached,
    funnelOpened,
    funnelStarted,
    funnelSubmitted,
  };
}

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

type PerformanceStatus = 'ON_TARGET' | 'BELOW_TARGET' | 'EXCEEDING_TARGET';

type InsightsResponse = Record<
  string,
  string | number | boolean | object | null
>;

type KpiStatus = 'ON_TARGET' | 'BELOW_TARGET' | 'EXCEEDING_TARGET';

function kpiStatusForResponses(
  responsesCount: number,
  responseLimit: number | null,
  daysActive: number,
): KpiStatus {
  if (!responseLimit || responseLimit <= 0 || daysActive <= 0) {
    return responsesCount > 0 ? 'ON_TARGET' : 'BELOW_TARGET';
  }
  const expectedPace = responseLimit / Math.max(daysActive, 1);
  const actualPace = responsesCount / daysActive;
  if (actualPace >= expectedPace * 1.1) return 'EXCEEDING_TARGET';
  if (actualPace >= expectedPace * 0.7) return 'ON_TARGET';
  return 'BELOW_TARGET';
}

function kpiStatusForCompletion(rate: number): KpiStatus {
  if (rate >= 60) return 'EXCEEDING_TARGET';
  if (rate >= 35) return 'ON_TARGET';
  return 'BELOW_TARGET';
}

function kpiStatusForDuration(seconds: number | null): KpiStatus {
  if (seconds == null) return 'ON_TARGET';
  if (seconds <= 90) return 'EXCEEDING_TARGET';
  if (seconds <= 180) return 'ON_TARGET';
  return 'BELOW_TARGET';
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly insightsInFlight = new Map<
    string,
    Promise<InsightsResponse>
  >();

  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
    @InjectQueue('ai-insights') private readonly insightsQueue: Queue,
    private readonly aiRateLimit: FormAiRateLimitService,
    private readonly aiTier: AiTierService,
    private readonly insightsGenerator: InsightsGeneratorService,
    private readonly formContext: FormContextService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly bestResponsesRanker: BestResponsesRankerService,
  ) {}

  async getAnalytics(formId: string, userId: string, range?: string) {
    const rangeKey = range ?? 'all';
    const perfCacheKey = REDIS_KEYS.analyticsPerformance(formId, rangeKey);
    const perfCached = await safeRedisGet(this.redis, perfCacheKey);
    if (perfCached) {
      try {
        return JSON.parse(perfCached);
      } catch {
        /* recompute */
      }
    }

    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      include: { settings: true },
    });
    if (!form) throw new NotFoundException('Form not found');

    const responseLimit = form.settings?.responseLimit ?? 500;

    const cutoff = rangeCutoff(range);
    const dateFilter = cutoff ? { gte: cutoff } : undefined;

    const responseWhere = {
      formId,
      ...(dateFilter && { createdAt: dateFilter }),
    };
    const completedStatuses = ['PROCESSED', 'PENDING'] as const;

    // "total" = non-abandoned submissions — matches what the Responses tab lists.
    // "abandoned" = sessions that started but did not submit — used for funnel start count.
    const [total, abandoned, processed, agg, responsePayloads] =
      await Promise.all([
        this.prisma.formResponse.count({
          where: { ...responseWhere, status: { not: 'ABANDONED' as any } },
        }),
        this.prisma.formResponse.count({
          where: { ...responseWhere, status: 'ABANDONED' as any },
        }),
        this.prisma.formResponse.count({
          where: {
            ...responseWhere,
            status: { in: [...completedStatuses] },
          },
        }),
        this.prisma.formResponse.aggregate({
          where: {
            formId,
            durationMs: { not: null },
            ...(dateFilter && { createdAt: dateFilter }),
          },
          _avg: { durationMs: true },
        }),
        this.prisma.formResponse.findMany({
          where: responseWhere,
          select: { payload: true, durationMs: true, status: true },
        }),
      ]);

    const snapshot = form.publishedSnapshot ?? form.builderSnapshot ?? null;
    const contentScreenCount = contentScreenCountFromSnapshot(snapshot);
    const screenDropoff = computeScreenDropoff(snapshot, responsePayloads);

    const completionRate =
      total > 0 ? Math.round((processed / total) * 1000) / 10 : 0;
    const avgDurationMs = agg._avg.durationMs ?? null;
    const avgTimePerQuestionMs =
      avgDurationMs && contentScreenCount > 0
        ? Math.round(avgDurationMs / contentScreenCount)
        : null;
    const avgTime = avgDurationMs ? formatDuration(avgDurationMs) : '—';
    const avgTimePerQuestion = avgTimePerQuestionMs
      ? formatDuration(avgTimePerQuestionMs)
      : '—';

    const parts: string[] = [`${completionRate}% completion`];
    if (avgDurationMs) parts.push(`avg ${avgTime}`);
    const insight = total > 0 ? parts.join(' · ') : 'No responses yet.';

    // Daily time-series for chart rendering
    const seriesStart =
      cutoff ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        d.setHours(0, 0, 0, 0);
        return d;
      })();
    type DailyRow = {
      day: Date;
      count: bigint;
      completions: bigint;
      avg_duration: number | null;
    };
    const rows = await this.prisma.$queryRaw<DailyRow[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*)::bigint AS count,
        COUNT(*) FILTER (WHERE status IN ('PROCESSED'::"ResponseStatus", 'PENDING'::"ResponseStatus")) AS completions,
        AVG("durationMs") AS avg_duration
      FROM "FormResponse"
      WHERE "formId" = ${formId}
        AND "createdAt" >= ${seriesStart}
      GROUP BY day
      ORDER BY day ASC
    `;

    const dailySeries = rows.map((r) => {
      const avgDuration = r.avg_duration
        ? Math.round(Number(r.avg_duration))
        : null;
      return {
        date: r.day.toISOString().slice(0, 10),
        count: Number(r.count),
        completions: Number(r.completions),
        avgDuration,
        avgTimePerQuestionSec:
          avgDuration && contentScreenCount > 0
            ? Math.round(avgDuration / 1000 / contentScreenCount)
            : null,
      };
    });

    // Funnel start = everyone who interacted with the form (including abandoned).
    // Funnel submitted = non-abandoned submissions (= total).
    const funnelCounts = deriveFunnelCounts(
      total + abandoned,
      total,
      completionRate,
    );
    const worst = worstDropStep(screenDropoff);
    const avgDurationSeconds = avgDurationMs
      ? Math.round(avgDurationMs / 1000)
      : null;

    const overview =
      total >= 1
        ? {
            responses: total,
            completionRate,
            avgDurationSeconds,
            responsesTrendWeek: null,
            completionTrendWeek: null,
            responseLimit,
            liveSince: form.publishedAt?.toISOString() ?? null,
            aiInsight:
              total >= 3 && worst
                ? {
                    text: `Completion is ${completionRate}% — ${worst.q} (${worst.label}) loses ${worst.dropPercent}% of respondents who reach it.`,
                    screenId: worst.screenId,
                    screenLabel: worst.label,
                    dropPercent: worst.dropPercent,
                    estimatedGain: Math.max(
                      1,
                      Math.round(
                        (worst.dropCount / Math.max(total, 1)) * total,
                      ),
                    ),
                    action: 'improve_screen' as const,
                  }
                : null,
          }
        : null;

    const result = {
      responses: total,
      completionRate,
      avgTime,
      avgDurationMs,
      avgDurationSeconds,
      avgTimePerQuestion,
      avgTimePerQuestionMs,
      contentScreenCount,
      screenDropoff,
      topDropOffFieldId: worst?.screenId ?? null,
      insight,
      dailySeries,
      overview,
      ...funnelCounts,
    };

    await safeRedisSet(
      this.redis,
      perfCacheKey,
      JSON.stringify(result),
      REDIS_TTL.analyticsPerformanceSeconds,
    );

    return result;
  }

  /** Form overlay Overview tab (handoff B.13). */
  async getOverview(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      include: { settings: true },
    });
    if (!form) throw new NotFoundException('Form not found');

    const tier = await this.aiTier.resolveTierForUser(userId);
    await this.aiRateLimit.assertOverviewAllowed(formId, tier);

    // Return cached result for up to 60s to avoid hammering DB on every page load.
    const overviewCacheKey = REDIS_KEYS.analyticsOverview(formId);
    const overviewCached = await safeRedisGet(this.redis, overviewCacheKey);
    if (overviewCached) {
      try {
        return JSON.parse(overviewCached) as object;
      } catch {
        /* regenerate */
      }
    }

    const ctx = await this.formContext.buildForForm(formId);

    const responsesCount = ctx.responseStats.count;
    const responseLimit = form.settings?.responseLimit ?? null;
    const publishedAt = form.publishedAt ?? form.createdAt;
    const daysActive = Math.max(
      0,
      Math.floor((Date.now() - publishedAt.getTime()) / 86_400_000),
    );

    const responsesPercentage =
      responseLimit && responseLimit > 0
        ? Math.min(100, Math.round((responsesCount / responseLimit) * 100))
        : 0;
    const responsesNeeded =
      responseLimit && responseLimit > 0
        ? Math.max(0, responseLimit - responsesCount)
        : 0;

    const [
      { trendWeekPercent: responsesTrendWeek },
      { trendWeekPercent: completionTrendWeek },
      { trendLabel: avgTimeTrendLabel },
      avgDurationAgg,
    ] = await Promise.all([
      this.weekTrendForMetric(formId, 'responses'),
      this.weekTrendForMetric(formId, 'completion'),
      this.weekTrendForMetric(formId, 'duration'),
      this.prisma.formResponse.aggregate({
        where: { formId, durationMs: { not: null } },
        _avg: { durationMs: true },
      }),
    ]);

    const completionRate = Math.round(ctx.responseStats.completionRate);
    const avgDurationSeconds = avgDurationAgg._avg.durationMs
      ? Math.round(avgDurationAgg._avg.durationMs / 1000)
      : null;

    let estDaysToTarget: number | null = null;
    if (responseLimit && responseLimit > responsesCount && daysActive > 0) {
      const dailyRate = responsesCount / daysActive;
      if (dailyRate > 0) {
        estDaysToTarget = Math.ceil(responsesNeeded / dailyRate);
      }
    }

    const aiInsight = await this.orchestrator.executeOverview(formId, tier);

    const result = {
      formId,
      publishedAt: publishedAt.toISOString(),
      daysActive,
      responsesCount,
      responseLimit,
      responsesPercentage,
      responsesNeeded,
      estDaysToTarget,
      performance: {
        responses: {
          value: responsesCount,
          trendWeekPercent: responsesTrendWeek,
          status: kpiStatusForResponses(
            responsesCount,
            responseLimit,
            Math.max(daysActive, 1),
          ),
        },
        completionRate: {
          value: completionRate,
          trendWeekPercent: completionTrendWeek,
          status: kpiStatusForCompletion(completionRate),
        },
        avgDurationSeconds: {
          value: avgDurationSeconds,
          trendLabel: avgTimeTrendLabel,
          status: kpiStatusForDuration(avgDurationSeconds),
        },
      },
      aiInsight,
    };

    void safeRedisSet(
      this.redis,
      overviewCacheKey,
      JSON.stringify(result),
      REDIS_TTL.analyticsOverviewSeconds,
    );
    return result;
  }

  private async weekTrendForMetric(
    formId: string,
    metric: 'responses' | 'completion' | 'duration',
  ): Promise<{
    trendWeekPercent: number | null;
    trendLabel: string | null;
  }> {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const [thisWeek, lastWeek] = await Promise.all([
      this.prisma.formResponse.findMany({
        where: { formId, createdAt: { gte: thisWeekStart } },
        select: { status: true, durationMs: true },
      }),
      this.prisma.formResponse.findMany({
        where: {
          formId,
          createdAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
        select: { status: true, durationMs: true },
      }),
    ]);

    if (thisWeek.length < 3 && lastWeek.length < 3) {
      return { trendWeekPercent: null, trendLabel: null };
    }

    if (metric === 'responses') {
      const delta = thisWeek.length - lastWeek.length;
      const pct =
        lastWeek.length > 0
          ? Math.round((delta / lastWeek.length) * 100)
          : thisWeek.length > 0
            ? 100
            : 0;
      return { trendWeekPercent: pct, trendLabel: null };
    }

    if (metric === 'completion') {
      const thisRate =
        thisWeek.length > 0
          ? (thisWeek.filter((r) => r.status === 'PROCESSED').length /
              thisWeek.length) *
            100
          : 0;
      const lastRate =
        lastWeek.length > 0
          ? (lastWeek.filter((r) => r.status === 'PROCESSED').length /
              lastWeek.length) *
            100
          : 0;
      return {
        trendWeekPercent: Math.round(thisRate - lastRate),
        trendLabel: null,
      };
    }

    const avg = (rows: { durationMs: number | null }[]) => {
      const vals = rows
        .map((r) => r.durationMs)
        .filter((v): v is number => v != null && v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const thisAvg = avg(thisWeek);
    const lastAvg = avg(lastWeek);
    if (thisAvg == null || lastAvg == null) {
      return { trendWeekPercent: null, trendLabel: 'same' };
    }
    const diff = Math.round((thisAvg - lastAvg) / 1000);
    const trendLabel =
      Math.abs(diff) < 5 ? 'same' : diff < 0 ? 'faster' : 'slower';
    return { trendWeekPercent: null, trendLabel };
  }

  async getCompare(formId: string, userId: string, range?: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const performance = await this.getAnalytics(formId, userId, range);
    const quality = await this.getResponseQuality(formId, userId);

    return {
      range: range ?? '7d',
      metrics: [
        {
          id: 'responses',
          label: 'Responses',
          value: performance.responses,
        },
        {
          id: 'completionRate',
          label: 'Completion rate',
          value: performance.completionRate,
          unit: '%',
        },
        {
          id: 'highQualityPct',
          label: 'High quality responses',
          value: quality.highQualityPct,
          unit: '%',
        },
      ],
      series: performance.dailySeries,
      insight: performance.insight,
    };
  }

  private async readHotResponsePreviews(formId: string, limit: number) {
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

  async getResponses(formId: string, userId: string, page = 1, range?: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const cutoff = rangeCutoff(range);
    const PAGE_SIZE = 25;

    const snapshot = form.publishedSnapshot ?? form.builderSnapshot ?? null;

    const where = {
      formId,

      status: { not: 'ABANDONED' as any },
      ...(cutoff && { createdAt: { gte: cutoff } }),
    };

    const total = await this.prisma.formResponse.count({ where });

    let items: ReturnType<typeof normalizeFormResponse>[];

    if (page === 1) {
      const hotItems = await this.readHotResponsePreviews(formId, PAGE_SIZE);
      const filteredHot = cutoff
        ? hotItems.filter((item) => new Date(item.submittedAt) >= cutoff)
        : hotItems;

      const dbRows = await this.prisma.formResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        select: {
          id: true,
          formId: true,
          payload: true,
          status: true,
          qualityScore: true,
          completedAt: true,
          durationMs: true,
          createdAt: true,
        },
      });

      const seen = new Set<string>();
      const merged: ReturnType<typeof normalizeFormResponse>[] = [];

      for (const item of filteredHot) {
        if (!seen.has(item.id)) {
          merged.push(item);
          seen.add(item.id);
        }
      }
      for (const row of dbRows) {
        if (!seen.has(row.id)) {
          merged.push(normalizeFormResponse(row, snapshot));
          seen.add(row.id);
        }
      }

      merged.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
      items = merged.slice(0, PAGE_SIZE);
    } else {
      const dbRows = await this.prisma.formResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          formId: true,
          payload: true,
          status: true,
          qualityScore: true,
          completedAt: true,
          durationMs: true,
          createdAt: true,
        },
      });
      items = dbRows.map((r) => normalizeFormResponse(r, snapshot));
    }

    return {
      items,
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  async getResponseQuality(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const [total, withScore, agg] = await Promise.all([
      this.prisma.formResponse.count({
        where: { formId, status: { not: 'ABANDONED' as any } },
      }),
      this.prisma.formResponse.count({
        where: {
          formId,
          qualityScore: { not: null },
          status: { not: 'ABANDONED' as any },
        },
      }),
      this.prisma.formResponse.aggregate({
        where: { formId, qualityScore: { not: null } },
        _avg: { qualityScore: true },
      }),
    ]);

    const avgScore = agg._avg.qualityScore ?? null;
    const highQualityCount =
      avgScore !== null
        ? await this.prisma.formResponse.count({
            where: { formId, qualityScore: { gte: 70 } },
          })
        : 0;
    const highQualityPct =
      withScore > 0 ? Math.round((highQualityCount / withScore) * 100) : 0;

    return {
      total,
      withScore,
      avgScore: avgScore ? Math.round(avgScore) : null,
      highQualityPct,
    };
  }

  async getTopResponses(
    formId: string,
    userId: string,
    limit = 5,
    minScore = 75,
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const tier = await this.aiTier.resolveTierForFormOwner(formId);
    const tierLimit = tier === 'pro' ? 5 : 3;
    const effectiveLimit = Math.min(limit, tierLimit);

    const rows = await this.prisma.formResponse.findMany({
      where: {
        formId,
        status: { not: 'ABANDONED' as any },
      },
      orderBy: [{ qualityScore: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      select: {
        id: true,
        payload: true,
        qualityScore: true,
        completedAt: true,
        createdAt: true,
      },
    });

    const snapshot = form.publishedSnapshot ?? form.builderSnapshot;
    const ranked = await this.bestResponsesRanker.rankTopResponses(
      formId,
      rows.map((r) => ({
        id: r.id,
        qualityScore: r.qualityScore,
        submittedAt: r.completedAt ?? r.createdAt,
        payload: r.payload,
      })),
      snapshot,
      effectiveLimit,
      minScore,
      tier,
    );

    return {
      items: ranked.responses,
      meta: ranked.meta,
    };
  }

  async getAiInsights(formId: string, userId: string, range?: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const rangeKey = range ?? 'all';
    const cacheKey = REDIS_KEYS.analyticsInsights(formId, rangeKey);
    const cached = await safeRedisGet(this.redis, cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as InsightsResponse;
        if (parsed.status === 'ready') {
          return this.enrichCachedInsights(parsed);
        }
        if (parsed.status === 'processing') {
          const useQueue = process.env.AI_INSIGHTS_USE_QUEUE === 'true';
          if (!useQueue) {
            return this.insightsGenerator.generateReady(
              formId,
              cacheKey,
              rangeKey,
            );
          }
          const startedAt =
            typeof parsed.startedAt === 'string'
              ? Date.parse(parsed.startedAt)
              : NaN;
          const stale =
            Number.isFinite(startedAt) && Date.now() - startedAt > 120_000;
          if (stale) {
            this.logger.warn(
              `Stale insights job for form ${formId}; regenerating inline`,
            );
            return this.startInsightsGeneration(
              formId,
              userId,
              range,
              rangeKey,
              cacheKey,
            );
          }
        }
        return parsed;
      } catch {
        /* fall through */
      }
    }

    const cutoff = rangeCutoff(range);
    const totalResponses = await this.prisma.formResponse.count({
      where: {
        formId,
        ...(cutoff && { createdAt: { gte: cutoff } }),
      },
    });
    if (totalResponses < 10) {
      return {
        status: 'insufficient_data',
        minRequired: 10,
        current: totalResponses,
        responseCount: totalResponses,
        message: 'Need at least 10 responses',
      };
    }

    return this.startInsightsGeneration(
      formId,
      userId,
      range,
      rangeKey,
      cacheKey,
    );
  }

  private startInsightsGeneration(
    formId: string,
    userId: string,
    range: string | undefined,
    rangeKey: string,
    cacheKey: string,
  ): Promise<InsightsResponse> {
    const inFlightKey = `${formId}:${rangeKey}`;
    const existing = this.insightsInFlight.get(inFlightKey);
    if (existing) return existing;

    const work = (async (): Promise<InsightsResponse> => {
      const tier = await this.aiTier.resolveTierForUser(userId);
      await this.aiRateLimit.assertAiInsightsAllowed(formId, tier);

      const useQueue = process.env.AI_INSIGHTS_USE_QUEUE === 'true';

      if (useQueue) {
        try {
          await this.insightsQueue.add(
            'generate-insights',
            { formId, userId, range: range ?? 'all', cacheKey },
            {
              attempts: 2,
              backoff: { type: 'exponential', delay: 3000 },
              jobId: `insights-${formId}-${range ?? 'all'}`,
            },
          );
          const processing: InsightsResponse = {
            status: 'processing',
            startedAt: new Date().toISOString(),
          };
          await safeRedisSet(
            this.redis,
            cacheKey,
            JSON.stringify(processing),
            REDIS_TTL.analyticsInsightsSeconds,
          );
          return processing;
        } catch (err) {
          this.logger.warn(
            `Insights queue unavailable, falling back to inline: ${err}`,
          );
        }
      }

      return this.insightsGenerator.generateReady(
        formId,
        cacheKey,
        range ?? 'all',
      );
    })();

    this.insightsInFlight.set(inFlightKey, work);
    return work.finally(() => {
      this.insightsInFlight.delete(inFlightKey);
    });
  }

  private enrichCachedInsights(cached: InsightsResponse) {
    const summary = String(cached.summaryText ?? cached.insight ?? '');
    const priorityBody = String(cached.priorityBody ?? '');
    if (
      summary &&
      priorityBody &&
      summary !== priorityBody &&
      cached.priorityTitle &&
      Array.isArray(cached.recommendedActions)
    ) {
      return cached;
    }
    const total = Number(cached.total ?? cached.responseCount ?? 0);
    const completionRate = Number(cached.completionRate ?? 0);
    const avgQuality = Number(cached.avgQuality ?? cached.npsScore ?? 0);
    return buildInsightsReadyPayload({
      summaryText:
        summary || `${total} responses · ${completionRate}% completion.`,
      priorityTitle: String(cached.priorityTitle ?? 'Review recent feedback'),
      priorityBody:
        priorityBody ||
        'Open the Responses tab to read what respondents are saying.',
      total,
      completionRate,
      avgQuality,
    });
  }
}

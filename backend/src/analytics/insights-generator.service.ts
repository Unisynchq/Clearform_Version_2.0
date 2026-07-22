import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import type { Redis } from 'ioredis';
import { REDIS_TTL } from '../common/redis-cache-keys';
import { safeRedisSet } from '../redis/redis-cache.util';
import { AiOrchestratorService } from '../ai/ai-orchestrator.service';
import { FormContextService } from '../ai/form-context.service';
import { AiTierService } from '../ai/ai-tier.service';
import {
  computeScreenDropoff,
  worstDropStep,
} from './analytics-snapshot.util';
import { buildInsightsReadyPayload } from './insights-payload.util';
import {
  collectQuestionAnswers,
  sentimentFromAnswerText,
} from './insights-context.util';

function rangeCutoff(range?: string): Date | undefined {
  if (!range || range === 'all') return undefined;
  const days =
    range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : undefined;
  if (!days) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Builds AI insights from real response content (handoff B.12) via orchestrator. */
@Injectable()
export class InsightsGeneratorService {
  private readonly logger = new Logger(InsightsGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly formContext: FormContextService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly aiTier: AiTierService,
  ) {}

  async generateReady(
    formId: string,
    cacheKey?: string,
    range = 'all',
  ) {
    const tier = await this.aiTier.resolveTierForFormOwner(formId);
    const cutoff = rangeCutoff(range);
    const dateFilter = cutoff ? { gte: cutoff } : undefined;
    const responseWhere = {
      formId,
      ...(dateFilter && { createdAt: dateFilter }),
    };

    const context = await this.formContext.buildForForm(formId, range);
    const snapshot = context.snapshot;

    const responseRows = await this.prisma.formResponse.findMany({
      where: responseWhere,
      select: {
        payload: true,
        createdAt: true,
        qualityScore: true,
        durationMs: true,
        status: true,
      },
    });

    const { count: total, completionRate, avgQuality } = context.responseStats;

    const qaRows = collectQuestionAnswers(
      snapshot,
      responseRows.map((r) => r.payload),
    );
    const sentiment = sentimentFromAnswerText(qaRows);
    const screenDropoff = computeScreenDropoff(snapshot, responseRows);
    const worstDrop = worstDropStep(screenDropoff);

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sevenDayTrend = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const count = responseRows.filter(
        (r) => r.createdAt >= dayStart && r.createdAt < dayEnd,
      ).length;
      return { label: weekdayShort[dayStart.getDay()], count };
    });

    let summaryText: string;
    let priorityTitle: string;
    let priorityBody: string;
    let topIssueCategory: string;
    let confidencePercent: number | null;

    try {
      const orchestrated = await this.orchestrator.executeInsights(
        formId,
        range,
        tier,
      );
      summaryText = orchestrated.summaryText;
      priorityTitle = orchestrated.priorityTitle;
      priorityBody = orchestrated.priorityBody;
      topIssueCategory = orchestrated.topIssueCategory;
      confidencePercent = orchestrated.confidencePercent;
    } catch (err) {
      this.logger.warn(`Orchestrator insights failed: ${err}`);
      summaryText = `${total} responses · ${completionRate}% completion.`;
      priorityTitle = 'Review recent feedback';
      priorityBody =
        'Open the Responses tab to read what respondents are saying.';
      topIssueCategory = 'Feedback themes';
      confidencePercent = total >= 10 ? 58 : null;
    }

    const patternMin = tier === 'pro' ? 15 : 25;
    const patterns = this.buildPatternsFromAnswers(qaRows, total, patternMin, tier);

    const result = buildInsightsReadyPayload({
      summaryText,
      priorityTitle,
      priorityBody,
      total,
      completionRate,
      avgQuality: avgQuality ?? 0,
      sentiment,
      sevenDayTrend,
      topIssueCategory,
      topIssuePercent:
        completionRate < 50
          ? Math.max(0, 100 - completionRate)
          : undefined,
      confidencePercent,
      patterns: patterns.length > 0 ? patterns : undefined,
      worstDrop,
      qaRows,
    });

    if (cacheKey) {
      await safeRedisSet(
        this.redis,
        cacheKey,
        JSON.stringify(result),
        REDIS_TTL.analyticsInsightsSeconds,
      );
    }

    return result;
  }

  private buildPatternsFromAnswers(
    qaRows: import('./insights-context.util').QuestionAnswerRow[],
    total: number,
    minResponses = 25,
    tier: import('../ai/ai-tier.service').AiTier = 'free',
  ) {
    if (total < minResponses || qaRows.length === 0) return [];

    const byQuestion = new Map<string, string[]>();
    for (const row of qaRows) {
      const list = byQuestion.get(row.question) ?? [];
      list.push(row.answer);
      byQuestion.set(row.question, list);
    }

    return [...byQuestion.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([question, answers]) => ({
        percent: Math.round((answers.length / Math.max(total, 1)) * 100),
        label: question,
        tag: 'neutral',
        description: `${answers.length} mention(s) in recent responses.`,
        examples: answers.slice(0, tier === 'pro' ? 3 : 2),
      }));
  }
}

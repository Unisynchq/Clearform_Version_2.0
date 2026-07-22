import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { REDIS_KEYS, REDIS_TTL } from '../../common/redis-cache-keys';
import { PrismaService } from '../../prisma/prisma.service';
import { PILOT_35_PLAN } from '../../config/plans';
import {
  creditsForAction,
  type AiCreditAction,
} from '../../config/ai-credits.config';
import {
  BillingEntitlementsService,
  upgradeRequired,
} from './billing-entitlements.service';

/**
 * How much live AI a respondent session gets, given the form owner's plan:
 * - 'full'       — paid plan, no trial accounting.
 * - 'trial'      — free plan within the trial quota; counts a session once.
 * - 'rules-only' — trial exhausted or session id missing on a capped plan;
 *                  callers must throw UPGRADE_REQUIRED — never serve offline copy.
 */
export type QualityAiAccess = 'full' | 'trial' | 'rules-only';

/** Finite AI credit wallet snapshot — every field is always a concrete value. */
export type AiCreditUsage = {
  used: number;
  limit: number;
  remaining: number;
  periodLabel: string;
};

/** @deprecated Use AiCreditUsage — alias kept for one-release call sites. */
export type AiTokenUsage = AiCreditUsage;

@Injectable()
export class AiEntitlementsService {
  private readonly logger = new Logger(AiEntitlementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: BillingEntitlementsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Read (and lazily roll over) the account AI credit wallet.
   * Limits are always finite numbers from plans.ts — never null-unlimited.
   */
  async getAiCreditUsage(userId: string): Promise<AiCreditUsage> {
    const plan = await this.entitlements.getPlanForUser(userId);
    const limit = plan.ai.aiCreditsLimit;
    await this.ensureUsageRow(userId);
    await this.rollCreditPeriodIfNeeded(userId, plan.id === PILOT_35_PLAN.id);
    const usage = await this.prisma.aiUsage.findUnique({
      where: { userId },
    });
    const used = usage?.aiCreditsUsed ?? 0;
    const remaining = Math.max(0, limit - used);
    const periodLabel =
      plan.id === PILOT_35_PLAN.id ? 'Pilot period' : 'This month';
    return { used, limit, remaining, periodLabel };
  }

  /** @deprecated Prefer getAiCreditUsage */
  async getAiTokenUsage(userId: string): Promise<AiCreditUsage> {
    return this.getAiCreditUsage(userId);
  }

  /**
   * Fail closed when the wallet cannot cover `cost` credits.
   * Call before any owner-billed product AI action.
   */
  async assertAiCreditsAvailable(
    userId: string,
    cost: number,
  ): Promise<AiCreditUsage> {
    const balance = await this.getAiCreditUsage(userId);
    if (balance.remaining >= cost) return balance;

    throw upgradeRequired(
      'ai_credits',
      `You've used all ${balance.limit.toLocaleString('en-US')} AI credits on your plan. Upgrade to Clearform Pilot for a larger AI allowance.`,
      {
        used: balance.used,
        limit: balance.limit,
        period: balance.periodLabel === 'This month' ? 'month' : 'lifetime',
      },
    );
  }

  /** Assert using a named product action's configured cost. */
  async assertCreditsForAction(
    userId: string,
    action: AiCreditAction,
  ): Promise<AiCreditUsage> {
    return this.assertAiCreditsAvailable(userId, creditsForAction(action));
  }

  /**
   * Debit credits after a successful product action. Failed AI = do not call.
   */
  async debitAiCredits(
    userId: string,
    credits: number,
    opts: {
      action: AiCreditAction | string;
      formId?: string;
      meta?: Record<string, unknown>;
    },
  ): Promise<void> {
    if (!Number.isInteger(credits) || credits <= 0) {
      this.logger.warn(
        `debitAiCredits ignored invalid amount user=${userId} credits=${credits}`,
      );
      return;
    }
    await this.ensureUsageRow(userId);
    await this.prisma.$transaction([
      this.prisma.aiUsage.update({
        where: { userId },
        data: { aiCreditsUsed: { increment: credits } },
      }),
      this.prisma.aiCreditLedger.create({
        data: {
          userId,
          action: opts.action,
          credits,
          formId: opts.formId,
          status: 'debited',
          meta: opts.meta
            ? (opts.meta as Prisma.InputJsonValue)
            : undefined,
        },
      }),
    ]);
  }

  async debitCreditsForAction(
    userId: string,
    action: AiCreditAction,
    formId?: string,
  ): Promise<void> {
    await this.debitAiCredits(userId, creditsForAction(action), {
      action,
      formId,
    });
  }

  /** @deprecated Prefer debitAiCredits — no-op compatibility if any caller remains. */
  async debitAiTokens(userId: string, tokens: number): Promise<void> {
    this.logger.warn(
      `debitAiTokens called (legacy) user=${userId} tokens=${tokens} — ignored; use action credits`,
    );
  }

  /** @deprecated Prefer assertAiCreditsAvailable */
  async assertAiTokensAvailable(userId: string): Promise<AiCreditUsage> {
    return this.assertAiCreditsAvailable(userId, 1);
  }

  /** Reset the wallet when a paid/promo pilot activates. */
  async resetAiCreditWallet(userId: string): Promise<void> {
    await this.ensureUsageRow(userId);
    await this.prisma.aiUsage.update({
      where: { userId },
      data: {
        aiCreditsUsed: 0,
        aiCreditsPeriodStart: new Date(),
      },
    });
  }

  /** @deprecated Prefer resetAiCreditWallet */
  async resetAiTokenWallet(userId: string): Promise<void> {
    return this.resetAiCreditWallet(userId);
  }

  private utcMonthStart(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }

  private async rollCreditPeriodIfNeeded(
    userId: string,
    isPilot: boolean,
  ): Promise<void> {
    // Pilot window is activated explicitly (claim/promo); no calendar rollover.
    if (isPilot) return;

    const usage = await this.prisma.aiUsage.findUnique({
      where: { userId },
    });
    if (!usage) return;

    const now = new Date();
    const periodStart = usage.aiCreditsPeriodStart;
    if (
      periodStart.getUTCFullYear() === now.getUTCFullYear() &&
      periodStart.getUTCMonth() === now.getUTCMonth()
    ) {
      return;
    }

    await this.prisma.aiUsage.update({
      where: { userId },
      data: {
        aiCreditsUsed: 0,
        aiCreditsPeriodStart: this.utcMonthStart(now),
      },
    });
  }

  /**
   * Consume one lifetime AI logic generation, or throw UPGRADE_REQUIRED when
   * the plan's quota is spent. Unlimited plans pass through untouched.
   * The conditional updateMany makes the consume atomic under concurrency.
   */
  async checkAndConsumeLogicGeneration(userId: string): Promise<void> {
    const plan = await this.entitlements.getPlanForUser(userId);
    const limit = plan.ai.logicGenerationsTotal;
    if (limit == null) return;

    await this.ensureUsageRow(userId);
    const consumed = await this.prisma.aiUsage.updateMany({
      where: { userId, logicGenerationsUsed: { lt: limit } },
      data: { logicGenerationsUsed: { increment: 1 } },
    });
    if (consumed.count > 0) return;

    throw upgradeRequired(
      'ai_logic',
      `You've used all ${limit} free AI logic generations. Upgrade to Clearform Pilot for unlimited AI logic.`,
      { used: limit, limit, period: 'lifetime' },
    );
  }

  /**
   * Read-only entitlement check — does not consume trial sessions. Use for
   * owner builder preview and post-submit scoring so they mirror live traffic.
   */
  async peekQualityAiAccess(
    ownerUserId: string,
    formId: string,
    sessionId?: string,
  ): Promise<QualityAiAccess> {
    const plan = await this.entitlements.getPlanForUser(ownerUserId);
    const limit = plan.ai.qualityTrialSessions;
    if (limit == null) return 'full';

    const usage = await this.prisma.aiUsage.findUnique({
      where: { userId: ownerUserId },
    });
    const used = usage?.qualitySessionsUsed ?? 0;
    if (used < limit) return 'trial';

    const member = sessionId ? `${formId}:${sessionId}` : null;
    if (!member) return 'rules-only';

    try {
      const inFlight = await this.redis.sismember(
        REDIS_KEYS.aiTrialQualitySessions(ownerUserId),
        member,
      );
      return inFlight ? 'trial' : 'rules-only';
    } catch {
      return 'rules-only';
    }
  }

  /**
   * Throws UPGRADE_REQUIRED when live AI coaching is blocked (trial exhausted
   * or session id missing on a capped plan). Use before any LLM-backed eval.
   */
  async assertQualityAiAccess(
    ownerUserId: string,
    formId: string,
    sessionId?: string,
    mode: 'peek' | 'resolve' = 'resolve',
  ): Promise<QualityAiAccess> {
    const access =
      mode === 'peek'
        ? await this.peekQualityAiAccess(ownerUserId, formId, sessionId)
        : await this.resolveQualityAiAccess(ownerUserId, formId, sessionId);
    if (access !== 'rules-only') return access;

    const plan = await this.entitlements.getPlanForUser(ownerUserId);
    const limit = plan.ai.qualityTrialSessions;
    throw upgradeRequired(
      'ai_quality',
      limit != null
        ? `Free AI coaching sessions used (${limit}). Upgrade to Clearform Pilot for unlimited live AI feedback.`
        : 'AI coaching is not available on your plan.',
      limit != null
        ? { used: limit, limit, period: 'lifetime' }
        : { used: 0, limit: 0, period: 'lifetime' },
    );
  }

  async resolveQualityAiAccess(
    ownerUserId: string,
    formId: string,
    sessionId?: string,
  ): Promise<QualityAiAccess> {
    const plan = await this.entitlements.getPlanForUser(ownerUserId);
    const limit = plan.ai.qualityTrialSessions;
    if (limit == null) return 'full';

    const usage = await this.prisma.aiUsage.findUnique({
      where: { userId: ownerUserId },
    });
    const used = usage?.qualitySessionsUsed ?? 0;
    const member = sessionId ? `${formId}:${sessionId}` : null;
    const key = REDIS_KEYS.aiTrialQualitySessions(ownerUserId);

    if (used >= limit) {
      if (!member) return 'rules-only';
      try {
        const inFlight = await this.redis.sismember(key, member);
        return inFlight ? 'trial' : 'rules-only';
      } catch {
        return 'rules-only';
      }
    }

    // Require a valid session id before granting counted trial AI — prevents
    // unbounded LLM for clients that omit sessionId.
    if (!member) return 'rules-only';
    try {
      const added = await this.redis.sadd(key, member);
      await this.redis
        .expire(key, REDIS_TTL.aiTrialQualitySessionsSeconds)
        .catch(() => {});
      if (added === 1) {
        await this.ensureUsageRow(ownerUserId);
        await this.prisma.aiUsage.update({
          where: { userId: ownerUserId },
          data: { qualitySessionsUsed: { increment: 1 } },
        });
      }
    } catch (err) {
      // Fail-open: trial counting is best-effort, mirroring the rate limiter.
      this.logger.warn(
        `Trial session counting failed (allowing AI): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return 'trial';
  }

  private async ensureUsageRow(userId: string): Promise<void> {
    await this.prisma.aiUsage.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }
}

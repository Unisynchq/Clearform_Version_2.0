import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { REDIS_KEYS } from './redis-cache-keys';
import { safeRedisIncr } from '../redis/redis-cache.util';
import type { AiTier } from '../ai/ai-tier.service';

type LimitConfig = { max: number; windowSeconds: number };

const OWNER_PREVIEW_RESPONSE_QUALITY: LimitConfig = {
  max: 600,
  windowSeconds: 60,
};

/**
 * Soft infra ceilings only — credit wallet + plan entitlements are the real
 * product gates. These numbers are high enough that normal free/pilot use
 * never hits them; they only blunt runaway loops / abuse.
 */
const LIMITS: Record<
  AiTier,
  {
    aiInsights: LimitConfig;
    logicGenerate: LimitConfig;
    responseQuality: LimitConfig;
    improveInstructions: LimitConfig;
    overview: LimitConfig;
  }
> = {
  free: {
    aiInsights: { max: 200, windowSeconds: 3600 },
    logicGenerate: { max: 100, windowSeconds: 3600 },
    responseQuality: { max: 10_000, windowSeconds: 60 },
    improveInstructions: { max: 500, windowSeconds: 3600 },
    overview: { max: 200, windowSeconds: 3600 },
  },
  pro: {
    aiInsights: { max: 500, windowSeconds: 3600 },
    logicGenerate: { max: 200, windowSeconds: 3600 },
    responseQuality: { max: 10_000, windowSeconds: 60 },
    improveInstructions: { max: 1_000, windowSeconds: 3600 },
    overview: { max: 500, windowSeconds: 3600 },
  },
};

@Injectable()
export class FormAiRateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(FormAiRateLimitService.name);
  private readonly memory = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private readonly sweepTimer: ReturnType<typeof setInterval>;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.sweepTimer = setInterval(
      () => this.sweepExpiredMemory(),
      5 * 60 * 1000,
    );
    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.sweepTimer);
  }

  private sweepExpiredMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.resetAt <= now) this.memory.delete(key);
    }
  }

  async assertAiInsightsAllowed(
    formId: string,
    tier: AiTier = 'free',
  ): Promise<void> {
    await this.assertAllowed(
      'ai-insights',
      REDIS_KEYS.rateLimitAiInsights(formId, tier),
      LIMITS[tier].aiInsights,
      tier,
    );
  }

  async assertLogicGenerateAllowed(
    formId: string,
    tier: AiTier = 'free',
  ): Promise<void> {
    await this.assertAllowed(
      'logic-generate',
      REDIS_KEYS.rateLimitLogicGenerate(formId, tier),
      LIMITS[tier].logicGenerate,
      tier,
    );
  }

  async assertResponseQualityAllowed(
    formId: string,
    tier: AiTier = 'free',
  ): Promise<void> {
    await this.assertAllowed(
      'response-quality',
      REDIS_KEYS.rateLimitResponseQuality(formId, tier),
      LIMITS[tier].responseQuality,
      tier,
    );
  }

  /** Form owners testing in builder preview — separate bucket from respondent traffic. */
  async assertResponseQualityOwnerPreview(
    formId: string,
    ownerUserId: string,
  ): Promise<void> {
    await this.assertAllowed(
      'response-quality owner preview',
      REDIS_KEYS.rateLimitResponseQualityOwnerPreview(formId, ownerUserId),
      OWNER_PREVIEW_RESPONSE_QUALITY,
      'pro',
    );
  }

  async assertImproveInstructionsAllowed(
    formId: string,
    tier: AiTier = 'free',
  ): Promise<void> {
    await this.assertAllowed(
      'improve-instructions',
      REDIS_KEYS.rateLimitImproveInstructions(formId, tier),
      LIMITS[tier].improveInstructions,
      tier,
    );
  }

  async assertOverviewAllowed(
    formId: string,
    tier: AiTier = 'free',
  ): Promise<void> {
    await this.assertAllowed(
      'overview',
      REDIS_KEYS.rateLimitOverview(formId, tier),
      LIMITS[tier].overview,
      tier,
    );
  }

  private async assertAllowed(
    label: string,
    key: string,
    config: LimitConfig,
    tier: AiTier,
  ): Promise<void> {
    const allowed = await this.consume(key, config);
    if (allowed) return;

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message:
          tier === 'free'
            ? `Rate limit exceeded for ${label}. Upgrade to Clearform Pilot for higher AI limits.`
            : `Rate limit exceeded for ${label}. Try again later.`,
        error: 'Too Many Requests',
        tier,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private async consume(key: string, config: LimitConfig): Promise<boolean> {
    try {
      const count = await safeRedisIncr(this.redis, key);
      if (count == null) {
        return this.consumeMemory(key, config);
      }
      if (count === 1) {
        await this.redis.expire(key, config.windowSeconds).catch(() => {});
      }
      return count <= config.max;
    } catch (err) {
      this.logger.warn(
        `Rate limit redis failed, using in-memory fallback: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.consumeMemory(key, config);
    }
  }

  private consumeMemory(key: string, config: LimitConfig): boolean {
    const now = Date.now();
    const entry = this.memory.get(key);
    if (!entry || entry.resetAt <= now) {
      this.memory.set(key, {
        count: 1,
        resetAt: now + config.windowSeconds * 1000,
      });
      return true;
    }
    if (entry.count >= config.max) return false;
    entry.count += 1;
    return true;
  }
}

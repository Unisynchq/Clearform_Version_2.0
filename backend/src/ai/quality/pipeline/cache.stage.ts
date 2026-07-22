import { createHash } from 'crypto';
import { REDIS_KEYS, REDIS_TTL } from '../../../common/redis-cache-keys';
import { safeRedisGet, safeRedisSet } from '../../../redis/redis-cache.util';
import type { EvaluateQualityDto, QualityResult } from '../../ai.service.types';
import type {
  QualityPipelineContext,
  QualityPipelineDeps,
  QualityStageOutcome,
} from './quality-pipeline.types';

function hashQualityPayload(dto: EvaluateQualityDto, tier: string): string {
  const payload = JSON.stringify({
    v: 5,
    q: dto.questionText ?? '',
    h: dto.helperText ?? '',
    s: dto.screenId ?? '',
    t: (dto.text ?? dto.answerText ?? '').slice(0, 400),
    o: dto.options ?? {},
    // Owner guidance, logic context, and tier all change the verdict/copy —
    // a stale cache after editing guidance or upgrading would be wrong.
    ci: dto.customInstructions ?? '',
    ls: dto.logicSummary ?? '',
    tier,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 20);
}

/**
 * Cache key for one evaluation. Includes the doctrine version so editing a
 * doctrine .md busts stale verdicts, and an optional session digest (session
 * memory changes what may be shown — a shared cache would serve repeats).
 */
export function buildQualityCacheKey(opts: {
  formId?: string;
  dto: EvaluateQualityDto;
  tier: string;
  doctrineVersion: string;
  sessionDigest?: string;
}): string {
  const suffix =
    (opts.doctrineVersion ? `:d${opts.doctrineVersion.slice(0, 8)}` : '') +
    (opts.sessionDigest ? `:s${opts.sessionDigest}` : '');
  return REDIS_KEYS.aiQualityEval(
    opts.formId ?? 'anon',
    hashQualityPayload(opts.dto, opts.tier) + suffix,
  );
}

export async function cacheLookupStage(
  ctx: QualityPipelineContext,
  deps: QualityPipelineDeps,
): Promise<QualityStageOutcome> {
  const cachedRaw = await safeRedisGet(deps.redis, ctx.cacheKey);
  if (cachedRaw) {
    try {
      return { result: JSON.parse(cachedRaw) as QualityResult, cache: false };
    } catch {
      /* regenerate */
    }
  }
  return null;
}

export async function cacheStore(
  ctx: QualityPipelineContext,
  deps: QualityPipelineDeps,
  result: QualityResult,
): Promise<void> {
  await safeRedisSet(
    deps.redis,
    ctx.cacheKey,
    JSON.stringify(result),
    REDIS_TTL.aiQualityEvalSeconds,
  );
}

import type { Redis } from 'ioredis';
import {
  REDIS_KEYS,
  REDIS_LIMITS,
  REDIS_TTL,
} from '../common/redis-cache-keys';
import {
  safeRedisExpire,
  safeRedisLpush,
  safeRedisLrange,
  safeRedisLtrim,
} from '../redis/redis-cache.util';
import {
  normalizeFormResponse,
  summarizePayload,
} from '../responses/response-payload.normalizer';

export type HotResponseEntry = ReturnType<typeof normalizeFormResponse>;

export async function pushRecentResponseToHotCache(
  redis: Redis,
  formId: string,
  response: {
    id: string;
    formId: string;
    payload: unknown;
    status: string;
    qualityScore: number | null;
    completedAt: Date | null;
    createdAt: Date;
  },
  snapshot?: unknown,
): Promise<HotResponseEntry> {
  const normalized = normalizeFormResponse(
    {
      id: response.id,
      formId: response.formId,
      payload: response.payload as object,
      status: response.status as 'PENDING' | 'PROCESSED' | 'FAILED',
      qualityScore: response.qualityScore,
      completedAt: response.completedAt,
      createdAt: response.createdAt,
    },
    snapshot,
  );

  const key = REDIS_KEYS.formResponsesRecent(formId);
  await safeRedisLpush(redis, key, JSON.stringify(normalized));
  await safeRedisLtrim(redis, key, 0, REDIS_LIMITS.formResponsesRecentMax - 1);
  await safeRedisExpire(redis, key, REDIS_TTL.formResponsesRecentSeconds);

  return normalized;
}

export async function readRecentResponsesFromHotCache(
  redis: Redis,
  formId: string,
  limit = 25,
): Promise<HotResponseEntry[]> {
  const key = REDIS_KEYS.formResponsesRecent(formId);
  const raw = await safeRedisLrange(redis, key, 0, limit - 1);
  const items: HotResponseEntry[] = [];
  for (const line of raw) {
    try {
      items.push(JSON.parse(line) as HotResponseEntry);
    } catch {
      /* skip corrupt entry */
    }
  }
  return items;
}

export function mergeHotCacheWithDbPage(
  hotItems: HotResponseEntry[],
  dbItems: HotResponseEntry[],
): HotResponseEntry[] {
  const byId = new Map<string, HotResponseEntry>();
  for (const item of dbItems) byId.set(item.id, item);
  for (const item of hotItems) byId.set(item.id, item);
  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function hotPreviewFromPayload(
  responseId: string,
  formId: string,
  payload: Record<string, unknown>,
  submittedAt: string,
  snapshot?: unknown,
): HotResponseEntry {
  const summary = summarizePayload(payload, snapshot);
  return {
    id: responseId,
    formId,
    submittedAt,
    status: 'completed',
    contact: summary.contact,
    answers: [],
    answerCount: summary.answerCount,
    qualityScore: null,
    ...(payload.answersByScreenId &&
    typeof payload.answersByScreenId === 'object'
      ? {
          answersByScreenId: payload.answersByScreenId,
        }
      : {}),
  };
}

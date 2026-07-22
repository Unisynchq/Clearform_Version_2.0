import type { Redis } from 'ioredis';
import { REDIS_KEYS } from './redis-cache-keys';
import { safeRedisDel } from '../redis/redis-cache.util';

export const ANALYTICS_CACHE_RANGES = ['7d', '30d', '90d', 'all'] as const;

export async function evictAnalyticsCaches(
  redis: Redis,
  formId: string,
): Promise<void> {
  await Promise.all([
    safeRedisDel(redis, REDIS_KEYS.analyticsOverview(formId)),
    ...ANALYTICS_CACHE_RANGES.map((range) =>
      safeRedisDel(redis, REDIS_KEYS.analyticsPerformance(formId, range)),
    ),
    ...ANALYTICS_CACHE_RANGES.map((range) =>
      safeRedisDel(redis, REDIS_KEYS.analyticsInsights(formId, range)),
    ),
  ]);
}

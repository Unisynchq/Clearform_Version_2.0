import { Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';

const logger = new Logger('RedisCache');
let degradedLogged = false;

function logDegradedOnce(message: string): void {
  if (degradedLogged) return;
  degradedLogged = true;
  logger.warn(message);
}

export async function safeRedisGet(
  redis: Redis,
  key: string,
): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (err) {
    logDegradedOnce(
      `Redis GET failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

export async function safeRedisSet(
  redis: Redis,
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> {
  try {
    if (ttlSeconds != null && ttlSeconds > 0) {
      await redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    logDegradedOnce(
      `Redis SET failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function safeRedisDel(redis: Redis, key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logDegradedOnce(
      `Redis DEL failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function safeRedisIncr(
  redis: Redis,
  key: string,
): Promise<number | null> {
  try {
    return await redis.incr(key);
  } catch (err) {
    logDegradedOnce(
      `Redis INCR failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

export async function safeRedisLpush(
  redis: Redis,
  key: string,
  value: string,
): Promise<void> {
  try {
    await redis.lpush(key, value);
  } catch (err) {
    logDegradedOnce(
      `Redis LPUSH failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function safeRedisLtrim(
  redis: Redis,
  key: string,
  start: number,
  stop: number,
): Promise<void> {
  try {
    await redis.ltrim(key, start, stop);
  } catch (err) {
    logDegradedOnce(
      `Redis LTRIM failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function safeRedisExpire(
  redis: Redis,
  key: string,
  ttlSeconds: number,
): Promise<void> {
  try {
    await redis.expire(key, ttlSeconds);
  } catch (err) {
    logDegradedOnce(
      `Redis EXPIRE failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function safeRedisLrange(
  redis: Redis,
  key: string,
  start: number,
  stop: number,
): Promise<string[]> {
  try {
    return await redis.lrange(key, start, stop);
  } catch (err) {
    logDegradedOnce(
      `Redis LRANGE failed (degraded mode): ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

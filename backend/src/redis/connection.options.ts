import type { RedisOptions } from 'ioredis';

export type ParsedRedisConnection = {
  host: string;
  port: number;
  password?: string;
  username?: string;
  tls?: Record<string, never>;
};

export function parseRedisUrl(redisUrl: string): ParsedRedisConnection {
  const parsed = new URL(redisUrl);
  const isTLS = parsed.protocol === 'rediss:';
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    tls: isTLS ? {} : undefined,
  };
}

export function createRedisOptions(redisUrl: string): RedisOptions {
  const { host, port, password, username, tls } = parseRedisUrl(redisUrl);
  return {
    host,
    port,
    password,
    username,
    tls,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Back off when Upstash quota / network errors — avoids log + request storms
    retryStrategy(times) {
      if (times > 30) return null;
      return Math.min(times * 500, 30_000);
    },
  };
}

export function createBullMqConnection(redisUrl: string) {
  return createRedisOptions(redisUrl);
}

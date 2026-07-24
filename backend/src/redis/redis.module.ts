import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { createRedisOptions } from './connection.options';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const url = config.get<string>('REDIS_URL');
        if (!url) {
          const logger = new Logger('RedisModule');
          logger.warn('REDIS_URL not configured — creating mock Redis client');
          return createMockRedis();
        }
        const redis = new Redis(createRedisOptions(url));
        redis.on('error', (err: Error) => {
          const logger = new Logger('Redis');
          logger.error(`Redis connection error: ${err.message}`);
        });
        redis.on('connect', () => {
          const logger = new Logger('Redis');
          logger.log('Redis connected');
        });
        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

function createMockRedis(): Redis {
  const mockStore = new Map<string, string>();
  const logger = new Logger('RedisMock');

  const handler = {
    get(_target: Record<string, unknown>, prop: string): unknown {
      if (prop === 'ping') return () => Promise.resolve('PONG');
      if (prop === 'get')
        return (key: string) => Promise.resolve(mockStore.get(key) ?? null);
      if (prop === 'set') {
        return (key: string, value: string) => {
          mockStore.set(key, value);
          return Promise.resolve('OK');
        };
      }
      if (prop === 'del') {
        return (...keys: string[]) => {
          let count = 0;
          for (const key of keys) {
            if (mockStore.delete(key)) count++;
          }
          return Promise.resolve(count);
        };
      }
      if (prop === 'incr') {
        return (key: string) => {
          const val = parseInt(mockStore.get(key) ?? '0', 10) + 1;
          mockStore.set(key, String(val));
          return Promise.resolve(val);
        };
      }
      if (prop === 'expire') {
        return () => Promise.resolve(1);
      }
      if (prop === 'lpush') {
        return (key: string, value: string) => {
          const existing = mockStore.get(key);
          const arr: string[] = existing
            ? (JSON.parse(existing) as string[])
            : [];
          arr.unshift(value);
          mockStore.set(key, JSON.stringify(arr));
          return Promise.resolve(arr.length);
        };
      }
      if (prop === 'lrange') {
        return (key: string, start: number, stop: number) => {
          const existing = mockStore.get(key);
          const arr: string[] = existing
            ? (JSON.parse(existing) as string[])
            : [];
          return Promise.resolve(arr.slice(start, stop + 1));
        };
      }
      if (prop === 'ltrim') {
        return (key: string, start: number, stop: number) => {
          const existing = mockStore.get(key);
          const arr: string[] = existing
            ? (JSON.parse(existing) as string[])
            : [];
          mockStore.set(key, JSON.stringify(arr.slice(start, stop + 1)));
          return Promise.resolve('OK');
        };
      }
      if (prop === 'on') return () => undefined;
      if (prop === 'quit') return () => Promise.resolve('OK');
      if (prop === 'disconnect') return () => undefined;
      if (prop === 'duplicate') return () => new Proxy({}, handler);
      if (prop === 'status') return 'mock';
      if (prop === 'then') return undefined;
      logger.warn(`Mock Redis: unsupported operation "${prop}"`);
      return () => Promise.resolve(null);
    },
  };

  return new Proxy({}, handler) as unknown as Redis;
}

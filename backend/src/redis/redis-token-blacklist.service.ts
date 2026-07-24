import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

const BLACKLIST_PREFIX = 'token:blacklist:';
const ACCESS_TTL = 900;
const REFRESH_TTL = 86400;

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private localBlacklist = new Set<string>();
  private lastSync = 0;
  private localMode = false;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.redis.ping().catch(() => {
      this.logger.warn(
        'Redis unavailable — token blacklist operating in local-only mode',
      );
      this.localMode = true;
    });
  }

  private blacklistKey(jti: string, type: 'access' | 'refresh'): string {
    return `${BLACKLIST_PREFIX}${type}:${jti}`;
  }

  async blacklistToken(
    jti: string,
    type: 'access' | 'refresh',
    expiresAt?: number,
  ): Promise<void> {
    const key = this.blacklistKey(jti, type);
    const ttl = type === 'access' ? ACCESS_TTL : REFRESH_TTL;

    if (this.localMode) {
      this.localBlacklist.add(key);
      return;
    }

    try {
      if (expiresAt) {
        const remaining = Math.max(
          1,
          expiresAt - Math.floor(Date.now() / 1000),
        );
        await this.redis.set(key, '1', 'EX', Math.min(remaining, ttl));
      } else {
        await this.redis.set(key, '1', 'EX', ttl);
      }
    } catch (err) {
      this.logger.warn(
        `Redis blacklist SET failed, using local: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.localBlacklist.add(key);
      this.localMode = true;
    }
  }

  async isBlacklisted(
    jti: string,
    type: 'access' | 'refresh',
  ): Promise<boolean> {
    const key = this.blacklistKey(jti, type);

    if (this.localMode) {
      return this.localBlacklist.has(key);
    }

    try {
      const result = await this.redis.get(key);
      return result === '1';
    } catch {
      return this.localBlacklist.has(key);
    }
  }

  async blacklistUserTokens(userId: string): Promise<void> {
    const key = `token:blacklist:user:${userId}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    if (this.localMode) {
      this.localBlacklist.add(key);
      return;
    }

    try {
      await this.redis.set(key, timestamp, 'EX', REFRESH_TTL);
    } catch (err) {
      this.logger.warn(
        `Redis user blacklist SET failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.localBlacklist.add(key);
    }
  }

  async isUserBlacklisted(userId: string, iat: number): Promise<boolean> {
    const key = `token:blacklist:user:${userId}`;

    if (this.localMode) {
      return this.localBlacklist.has(key);
    }

    try {
      const timestamp = await this.redis.get(key);
      if (!timestamp) return false;
      return iat < parseInt(timestamp, 10);
    } catch {
      return false;
    }
  }
}

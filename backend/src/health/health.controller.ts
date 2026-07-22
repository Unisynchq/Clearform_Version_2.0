import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { sentryEnabled } from '../instrument';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Redis } from 'ioredis';
import * as admin from 'firebase-admin';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';

@Controller('api/v1/health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.checkRedis(),
      () => this.checkFirebase(),
      () => this.checkSentry(),
    ]);
  }

  /**
   * Sends a test event and log to Sentry (completes Sentry "Verify" wizard).
   * Requires header `x-sentry-verify-key` matching VPS env `SENTRY_VERIFY_KEY`.
   */
  @Public()
  @Get('sentry-verify')
  sentryVerify(@Headers('x-sentry-verify-key') key?: string) {
    const expected = process.env.SENTRY_VERIFY_KEY?.trim();
    if (!expected || key !== expected) {
      throw new ForbiddenException('Invalid or missing x-sentry-verify-key');
    }
    if (!sentryEnabled) {
      return {
        ok: false,
        sent: false,
        message:
          'SENTRY_DSN is not set on this server. Add it to /var/www/clearform-backend/.env and pm2 restart.',
      };
    }
    const eventId = Sentry.captureMessage(
      'clearform-api Sentry verify (manual health check)',
      'info',
    );
    Sentry.logger.info('User triggered test log', {
      action: 'test_log',
      service: 'clearform-api',
    });
    return { ok: true, sent: true, eventId };
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { database: { status: 'up' } };
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const pong = await this.redis.ping();
    return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
  }

  private async checkFirebase(): Promise<HealthIndicatorResult> {
    const up = admin.apps.length > 0;
    return { firebase: { status: up ? 'up' : 'down' } };
  }

  /** Sentry is optional — never fail liveness when DSN is unset. */
  private async checkSentry(): Promise<HealthIndicatorResult> {
    return {
      sentry: {
        status: 'up',
        configured: sentryEnabled,
      },
    };
  }
}

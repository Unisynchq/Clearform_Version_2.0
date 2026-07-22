import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueEvents } from 'bullmq';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class ResponseQueueMonitor implements OnModuleInit {
  private readonly logger = new Logger(ResponseQueueMonitor.name);

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — skipping responses queue event monitor');
      return;
    }

    const events = new QueueEvents('responses', {
      connection: { url: redisUrl } as unknown as import('ioredis').RedisOptions,
    });

    events.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(
        `responses job ${jobId} failed permanently: ${failedReason}`,
      );
      if (process.env.SENTRY_DSN?.trim()) {
        Sentry.captureMessage(
          `BullMQ responses job ${jobId} failed: ${failedReason}`,
          'error',
        );
      }
    });
  }
}

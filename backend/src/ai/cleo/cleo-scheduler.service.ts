import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CLEO_QUEUE, CLEO_JOB_NAME } from './cleo.processor';

// 8:00 PM UTC = 1:30 AM IST — low-traffic window.
const CLEO_CRON = '0 20 * * *';

@Injectable()
export class CleoSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CleoSchedulerService.name);

  constructor(@InjectQueue(CLEO_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    try {
      await this.queue.upsertJobScheduler(
        'cleo-nightly-scheduler',
        { pattern: CLEO_CRON, tz: 'UTC' },
        { name: CLEO_JOB_NAME, data: {} },
      );
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setUTCHours(20, 0, 0, 0);
      if (nextRun <= now) nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      this.logger.log(
        `Cleo nightly job scheduled (cron: ${CLEO_CRON} UTC) — next run: ${nextRun.toISOString()}`,
      );
    } catch (err) {
      this.logger.warn(
        `Could not schedule Cleo nightly job: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}

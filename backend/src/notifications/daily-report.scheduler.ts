import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const DAILY_REPORT_CRON = '0 9 * * *';

export const DAILY_REPORT_QUEUE = 'daily-report';
export const DAILY_REPORT_JOB = 'send-daily-report';

@Injectable()
export class DailyReportScheduler implements OnModuleInit {
  private readonly logger = new Logger(DailyReportScheduler.name);

  constructor(@InjectQueue(DAILY_REPORT_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    try {
      await this.queue.upsertJobScheduler(
        'daily-report-scheduler',
        { pattern: DAILY_REPORT_CRON, tz: 'UTC' },
        { name: DAILY_REPORT_JOB, data: {} },
      );
      this.logger.log(
        `Daily report job scheduled (cron: ${DAILY_REPORT_CRON} UTC)`,
      );
    } catch (err) {
      this.logger.warn(
        `Could not schedule daily report job: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}

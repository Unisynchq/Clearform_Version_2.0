import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { DAILY_REPORT_QUEUE, DAILY_REPORT_JOB } from './daily-report.scheduler';

@Processor(DAILY_REPORT_QUEUE)
export class DailyReportProcessor extends WorkerHost {
  private readonly logger = new Logger(DailyReportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== DAILY_REPORT_JOB) return;

    this.logger.log('Generating daily form reports...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateStr = yesterday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const formsWithResponses = await this.prisma.form.findMany({
      where: {
        status: { notIn: ['TRASH', 'ARCHIVED'] },
        responses: {
          some: {
            createdAt: { gte: yesterday, lt: today },
            status: 'PROCESSED',
          },
        },
      },
      select: {
        id: true,
        title: true,
        ownerId: true,
        _count: {
          select: {
            responses: {
              where: {
                createdAt: { gte: yesterday, lt: today },
                status: 'PROCESSED',
              },
            },
          },
        },
      },
    });

    for (const form of formsWithResponses) {
      const count = form._count.responses;
      if (count === 0) continue;

      try {
        await this.notifications.create({
          userId: form.ownerId,
          formId: form.id,
          type: 'daily_report',
          title: 'Daily form report',
          body: `${count} people filled "${form.title}" on ${dateStr}`,
          action: {
            routeKey: 'analytics',
            params: { formId: form.id },
            label: 'View report',
          },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to create daily report notification for form ${form.id}: ${err}`,
        );
      }
    }

    this.logger.log(
      `Daily form reports generated for ${formsWithResponses.length} forms`,
    );
  }
}

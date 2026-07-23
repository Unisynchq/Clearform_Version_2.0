import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailService } from './mail.service';
import { EmailLogService } from './email-log.service';
import { ResendWebhookHandler } from './resend-webhook.handler';
import { NotificationSseService } from './notification-sse.service';
import { DailyReportScheduler } from './daily-report.scheduler';
import { DailyReportProcessor } from './daily-report.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'daily-report' }),
  ],
  providers: [
    NotificationsService,
    MailService,
    EmailLogService,
    ResendWebhookHandler,
    NotificationSseService,
    DailyReportScheduler,
    DailyReportProcessor,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, MailService, EmailLogService, NotificationSseService],
})
export class NotificationsModule {}

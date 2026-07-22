import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailService } from './mail.service';
import { EmailLogService } from './email-log.service';
import { ResendWebhookHandler } from './resend-webhook.handler';

@Module({
  providers: [
    NotificationsService,
    MailService,
    EmailLogService,
    ResendWebhookHandler,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, MailService, EmailLogService],
})
export class NotificationsModule {}

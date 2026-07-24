import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookProcessor } from './processors/webhook.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'webhooks' }),
    NotificationsModule,
  ],
  providers: [WebhooksService, WebhookProcessor],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}

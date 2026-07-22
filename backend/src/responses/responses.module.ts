import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { ResponseStatusController } from './responses-status.controller';
import { ResponseProcessor } from './processors/response.processor';
import { ResponseQueueMonitor } from './processors/response-queue-monitor.service';
import { AiModule } from '../ai/ai.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { BillingModule } from '../billing/billing.module';
import { ResponseFileStorageService } from './response-file-storage.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'responses' }),
    AiModule,
    WebhooksModule,
    NotificationsModule,
    IntegrationsModule,
    BillingModule,
  ],
  providers: [
    ResponsesService,
    ResponseProcessor,
    ResponseQueueMonitor,
    ResponseFileStorageService,
  ],
  controllers: [ResponsesController, ResponseStatusController],
})
export class ResponsesModule {}

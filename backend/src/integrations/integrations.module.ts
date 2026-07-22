import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { ComposioCallbackController } from './composio-callback.controller';
import { FormIntegrationsController } from './form-integrations.controller';
import { ComposioService } from './composio.service';
import { ComposioIntegrationProvider } from './providers/composio.provider';
import { IntegrationProviderFactory } from './providers/integration-provider.factory';
import { IntegrationDispatchProcessor } from './processors/integration-dispatch.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'integrations' })],
  providers: [
    ComposioService,
    ComposioIntegrationProvider,
    IntegrationProviderFactory,
    IntegrationsService,
    IntegrationDispatchProcessor,
  ],
  controllers: [
    IntegrationsController,
    ComposioCallbackController,
    FormIntegrationsController,
  ],
  exports: [IntegrationsService, ComposioService],
})
export class IntegrationsModule {}

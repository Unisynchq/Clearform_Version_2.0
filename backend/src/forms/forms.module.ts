import { Module, forwardRef } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { TemplatesController } from './templates.controller';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { BillingModule } from '../billing/billing.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    WebhooksModule,
    IntegrationsModule,
    BillingModule,
    forwardRef(() => AiModule),
  ],
  providers: [FormsService],
  controllers: [FormsController, TemplatesController],
})
export class FormsModule {}

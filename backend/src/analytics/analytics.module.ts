import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { InsightsProcessor } from './processors/insights.processor';
import { InsightsGeneratorService } from './insights-generator.service';
import { BestResponsesRankerService } from './best-responses-ranker.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ai-insights' }),
    AiModule,
    BillingModule,
  ],
  providers: [
    AnalyticsService,
    InsightsProcessor,
    InsightsGeneratorService,
    BestResponsesRankerService,
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

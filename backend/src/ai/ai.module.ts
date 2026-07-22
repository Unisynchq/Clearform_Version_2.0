import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiFeedbackService } from './ai-feedback.service';
import { AiFeedbackController } from './ai-feedback.controller';
import { QualityProcessor } from './processors/quality.processor';
import { LlmGatewayService } from './llm-gateway.service';
import { GeminiGatewayService } from './gemini-gateway.service';
import { DoctrineRegistry } from './doctrine/doctrine.registry';
import { FormContextService } from './form-context.service';
import { FormMemoryService } from './form-memory.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { GroundingValidatorService } from './grounding-validator.service';
import { AiTierService } from './ai-tier.service';
import { BillingModule } from '../billing/billing.module';
import { CleoLearningService } from './cleo/cleo-learning.service';
import { CleoJarvisService } from './cleo/cleo-jarvis.service';
import { CleoProcessor, CLEO_QUEUE } from './cleo/cleo.processor';
import { CleoSchedulerService } from './cleo/cleo-scheduler.service';
import { QuestionIntentService } from './question-intent/question-intent.service';
import { QdrantMemoryService } from './cleo/qdrant-memory.service';
import { SupermemoryService } from './cleo/supermemory.service';
import { FormQualityMemoryIndexer } from './form-quality-memory-indexer.service';
import { QualitySessionMemoryService } from './quality/quality-session-memory.service';
import { ImproveInstructionsService } from './quality/improve-instructions.service';

@Module({
  imports: [
    BillingModule,
    BullModule.registerQueue({ name: 'ai-quality' }),
    BullModule.registerQueue({ name: CLEO_QUEUE }),
  ],
  providers: [
    AiService,
    AiFeedbackService,
    QualityProcessor,
    LlmGatewayService,
    GeminiGatewayService,
    DoctrineRegistry,
    FormContextService,
    FormMemoryService,
    AiOrchestratorService,
    GroundingValidatorService,
    AiTierService,
    QdrantMemoryService,
    SupermemoryService,
    CleoLearningService,
    CleoJarvisService,
    CleoProcessor,
    CleoSchedulerService,
    QuestionIntentService,
    FormQualityMemoryIndexer,
    QualitySessionMemoryService,
    ImproveInstructionsService,
  ],
  controllers: [AiController, AiFeedbackController],
  exports: [
    AiService,
    ImproveInstructionsService,
    AiFeedbackService,
    LlmGatewayService,
    FormContextService,
    FormMemoryService,
    AiOrchestratorService,
    GroundingValidatorService,
    DoctrineRegistry,
    AiTierService,
    CleoLearningService,
    QdrantMemoryService,
    FormQualityMemoryIndexer,
  ],
})
export class AiModule {}

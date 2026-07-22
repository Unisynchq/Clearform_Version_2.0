import type { Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { FormContextService } from '../../form-context.service';
import type { FormMemoryService } from '../../form-memory.service';
import type { DoctrineRegistry } from '../../doctrine/doctrine.registry';
import type { GroundingValidatorService } from '../../grounding-validator.service';
import type { LlmGatewayService } from '../../llm-gateway.service';
import type { QuestionIntentService } from '../../question-intent/question-intent.service';
import type { AiTier } from '../../ai-tier.service';
import type {
  EvaluateQualityDto,
  NormalizedQualityOptions,
  QualityResult,
} from '../../ai.service.types';
import type { FormContext } from '../../form-context.types';
import type { QualityViolationKind } from '../../ai-quality-rules.util';
import type { QuestionIntent } from '../../question-intent/question-intent.types';
import type { QualitySessionMemory } from '../quality-session-memory.service';

/** Services the quality pipeline stages may touch (owned by the orchestrator). */
export type QualityPipelineDeps = {
  formContext: FormContextService;
  doctrine: DoctrineRegistry;
  memory: FormMemoryService;
  grounding: GroundingValidatorService;
  llm: LlmGatewayService;
  questionIntent: QuestionIntentService;
  redis: Redis;
  logger: Logger;
};

/**
 * Mutable state threaded through the stages in order. Early stages populate
 * the derived fields; later stages must not run before them.
 */
export type QualityPipelineContext = {
  formId?: string;
  dto: EvaluateQualityDto;
  tier: AiTier;
  cacheKey: string;

  // Populated by context.stage
  context: FormContext | null;
  enrichedDto: EvaluateQualityDto;
  text: string;

  // Populated by intent.stage
  intent: QuestionIntent;
  effectiveOptions: EvaluateQualityDto['options'];
  normalized: NormalizedQualityOptions;

  // Populated by violation.stage
  violationKind: QualityViolationKind;

  /** Respondent session id (validated) and what they've already seen. */
  sessionId?: string;
  session: QualitySessionMemory | null;

  /** Form owner — per-user budget caps and spend audit in the LLM gateway. */
  ownerUserId?: string;

  /** Builder preview: read unsaved builderSnapshot for form map + screen context. */
  preferBuilderSnapshot?: boolean;

  meta: { stagesRun: string[] };
};

/**
 * A stage either finishes the evaluation (returning the result and whether it
 * may be cached) or returns null so the runner continues to the next stage.
 */
export type QualityStageOutcome = {
  result: QualityResult;
  cache: boolean;
} | null;

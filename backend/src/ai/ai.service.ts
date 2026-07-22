import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { normalizeQualityOptions } from './ai-quality.util';

export type {
  EvaluateQualityDto,
  GenerateLogicDto,
  NormalizedQualityOptions,
  QualityResult,
} from './ai.service.types';

import type {
  EvaluateQualityDto,
  GenerateLogicDto,
  QualityResult,
} from './ai.service.types';

@Injectable()
export class AiService {
  constructor(
    @InjectQueue('ai-quality') private readonly qualityQueue: Queue,
    private readonly orchestrator: AiOrchestratorService,
  ) {}

  async queueQualityAnalysis(
    responseId: string,
    answers: unknown,
    formId?: string,
  ): Promise<void> {
    await this.qualityQueue.add(
      'score-response',
      { responseId, answers, formId },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
  }

  async generateFormLogic(
    formId: string,
    input?: GenerateLogicDto,
    tier?: import('./ai-tier.service').AiTier,
    ownerUserId?: string,
  ) {
    return this.orchestrator.executeLogicGeneration(
      formId,
      input,
      tier ?? 'free',
      ownerUserId,
    );
  }

  async evaluateQuality(
    dto: EvaluateQualityDto,
    formId?: string,
    tier?: import('./ai-tier.service').AiTier,
    opts?: { ownerUserId?: string; preferBuilderSnapshot?: boolean },
  ): Promise<QualityResult> {
    return this.orchestrator.executeQuality(formId, dto, tier ?? 'free', opts);
  }
}

export { normalizeQualityOptions };

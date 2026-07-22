import {
  normalizeQualityOptions,
  resolveEffectiveQualityOptions,
} from '../../ai-quality-rules.util';
import type {
  QualityPipelineContext,
  QualityPipelineDeps,
  QualityStageOutcome,
} from './quality-pipeline.types';

/** Classify the question's intent and resolve effective criteria options. */
export async function intentStage(
  ctx: QualityPipelineContext,
  deps: QualityPipelineDeps,
): Promise<QualityStageOutcome> {
  ctx.intent = await deps.questionIntent.classify(
    ctx.enrichedDto,
    ctx.context,
    ctx.tier,
  );
  ctx.effectiveOptions = resolveEffectiveQualityOptions(
    ctx.enrichedDto,
    ctx.intent,
  );
  ctx.normalized = normalizeQualityOptions(ctx.effectiveOptions);

  if (!ctx.text) {
    return {
      result: {
        level: 'red',
        message: 'Please provide a response.',
        failedIds: ctx.normalized.criteria.length ? ctx.normalized.criteria : [],
      },
      cache: false,
    };
  }
  return null;
}

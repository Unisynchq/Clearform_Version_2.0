import {
  classifyQualityViolation,
  buildGibberishResult,
} from '../../ai-quality-rules.util';
import type {
  QualityPipelineContext,
  QualityPipelineDeps,
  QualityStageOutcome,
} from './quality-pipeline.types';

/**
 * Hard safety gate only — instant gibberish red without an LLM call.
 * All other violations defer to llm.stage (doctrine-driven single eval).
 */
export async function violationStage(
  ctx: QualityPipelineContext,
  _deps: QualityPipelineDeps,
): Promise<QualityStageOutcome> {
  const { enrichedDto, text, formId } = ctx;

  ctx.violationKind = classifyQualityViolation(
    text,
    enrichedDto.questionText,
    enrichedDto.helperText,
  );
  const violationKind = ctx.violationKind;

  if (violationKind !== 'pure_gibberish') {
    return null;
  }

  const repeatViolation =
    (ctx.session?.totals[violationKind] ?? 0) > 0 ||
    (ctx.session?.screens[String(ctx.dto.screenId)]?.violations[
      violationKind
    ] ?? 0) > 0;

  return {
    result: buildGibberishResult({
      seed: `${formId ?? 'anon'}:${ctx.dto.screenId}:${text}`,
      repeat: repeatViolation,
    }),
    cache: true,
  };
}

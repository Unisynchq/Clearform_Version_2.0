import { pickCopy } from '../../doctrine/copy.registry';
import { violationKindToFailedIds } from '../../ai-quality-rules.util';
import { questionGroundedSuggestion } from './question-grounded-suggestion.util';
import type {
  QualityPipelineContext,
  QualityPipelineDeps,
  QualityStageOutcome,
} from './quality-pipeline.types';

/**
 * Last-resort coaching when the LLM path fails (OpenRouter flaky on free).
 * Never throw 503 for a valid evaluate request — give actionable amber/red.
 */
export async function finalizeStage(
  ctx: QualityPipelineContext,
  deps: QualityPipelineDeps,
): Promise<QualityStageOutcome> {
  const kind = ctx.violationKind;
  const failedIds =
    kind !== 'none' ? violationKindToFailedIds(kind) : ['completeness'];
  const level =
    kind === 'profanity' ||
    kind === 'hostile_dismissive' ||
    kind === 'pure_gibberish' ||
    kind === 'prompt_injection'
      ? 'red'
      : 'amber';
  const seed = `${ctx.formId ?? 'anon'}:${ctx.dto.screenId}:${ctx.text}`;
  const questionText =
    ctx.enrichedDto.questionText ?? ctx.dto.questionText ?? '';
  const message =
    pickCopy('amber.fallback', { seed }) ||
    (level === 'red'
      ? 'This answer does not help with the question — try again with a real detail.'
      : 'Add one concrete detail that directly answers the question.');
  const suggestion = questionGroundedSuggestion(questionText, seed);

  deps.logger.warn(
    `Quality finalize fallback form=${ctx.formId ?? 'anon'} kind=${kind} level=${level}`,
  );

  return {
    result: {
      level,
      message,
      failedIds: failedIds.length ? failedIds : ['completeness'],
      suggestions: [suggestion],
      followUpQuestion: null,
      meta: { source: 'rules_fallback', tier: ctx.tier },
    },
    cache: false,
  };
}

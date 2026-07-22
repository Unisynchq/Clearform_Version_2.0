import type { EvaluateQualityDto } from '../../ai.service.types';
import { deriveFacetsFromHelper } from '../default-owner-quality-prompt';
import { buildLogicSummary } from '../logic-summary.util';
import { resolveFormPurpose } from '../form-purpose.util';
import type {
  QualityPipelineContext,
  QualityPipelineDeps,
} from './quality-pipeline.types';

/**
 * Lightweight context for keystroke eval — skips response history DB queries
 * and merges per-screen snapshot options into the DTO.
 */
export async function contextStage(
  ctx: QualityPipelineContext,
  deps: QualityPipelineDeps,
): Promise<null> {
  ctx.context = ctx.formId
    ? await deps.formContext.buildForQualityOnly(ctx.formId, ctx.dto.screenId, {
        preferBuilderSnapshot: ctx.preferBuilderSnapshot,
      })
    : null;

  const screenContext = ctx.context?.screens.find(
    (s) => String(s.screenId) === String(ctx.dto.screenId),
  );
  const snapshot =
    ctx.context?.snapshot && typeof ctx.context.snapshot === 'object'
      ? (ctx.context.snapshot as Record<string, unknown>)
      : null;
  const screens = (snapshot?.screens as Record<string, unknown>[]) ?? [];
  const logicSummary =
    ctx.dto.logicSummary ??
    (snapshot && screens.length
      ? buildLogicSummary(snapshot, screens)
      : undefined);
  const mergedOptions =
    ctx.dto.options ??
    (screenContext?.qualityOptions as EvaluateQualityDto['options']);
  const customInstructions =
    ctx.dto.customInstructions?.trim() ||
    screenContext?.customInstructions?.trim() ||
    undefined;

  const text = (ctx.dto.text ?? ctx.dto.answerText ?? '').trim();
  ctx.text = text;
  ctx.enrichedDto = {
    ...ctx.dto,
    text,
    answerCharCount: ctx.dto.answerCharCount ?? text.length,
    facetsRequested:
      ctx.dto.facetsRequested?.length
        ? ctx.dto.facetsRequested
        : deriveFacetsFromHelper(ctx.dto.helperText, ctx.dto.questionText),
    options: mergedOptions,
    customInstructions,
    logicSummary,
    formTitle: ctx.dto.formTitle ?? ctx.context?.title,
    formPurpose:
      ctx.dto.formPurpose ??
      ctx.context?.purpose ??
      (snapshot ? resolveFormPurpose(snapshot, ctx.context?.title ?? '') : undefined),
  };
  return null;
}

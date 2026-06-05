import { useEffect, useRef, useState } from 'react';
import { evaluateResponseQualityApi } from '@/api/services/responseQualityService';
import { isApiConfigured } from '@/config/env';
import { evaluateResponseQuality } from '@/features/forms/utils/responseQualityScoring';

function buildEvaluatePayload({
  formId,
  screenId,
  fieldKind,
  question,
  helperText,
  answerText,
  options,
}) {
  const fieldType = fieldKind === 'longText' ? 'Long text' : 'Short text';
  const fieldId = fieldKind === 'longText' ? 'long-text' : 'short-text';
  return {
    formId: Number(formId),
    screenId: Number(screenId),
    fieldId,
    questionText: question ?? '',
    fieldType,
    helperText: helperText ?? '',
    answerText,
    options: {
      minWords: options?.length?.minWords,
      sensitivity: options?.specificity?.sensitivity,
      vagueWords: options?.specificity?.vagueWords,
      topicKeywords: options?.relevance?.topicKeywords,
      keywordThreshold: options?.relevance?.keywordThreshold,
      criteria: options,
    },
  };
}

function normalizeApiEvaluation(result) {
  if (!result?.level) return null;
  const failedIds = Array.isArray(result.failedIds) ? result.failedIds : [];
  return {
    level: result.level,
    failCount: failedIds.length,
    message: result.message ?? null,
    failedIds,
  };
}

/**
 * Debounced response-quality evaluation — API when configured, heuristics offline.
 */
export function useResponseQualityEvaluation({
  enabled,
  options,
  fieldKind,
  question,
  helperText,
  answerText,
  formId,
  screenId,
  debounceMs = 400,
}) {
  const [evaluation, setEvaluation] = useState(null);
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !options) {
      setEvaluation(null);
      return undefined;
    }

    const trimmed = String(answerText ?? '').trim();
    if (!trimmed) {
      setEvaluation(null);
      return undefined;
    }

    const runHeuristics = () =>
      evaluateResponseQuality(trimmed, { enabled, options, fieldKind, question });

    if (!isApiConfigured() || formId == null || screenId == null) {
      setEvaluation(runHeuristics());
      return undefined;
    }

    clearTimeout(timerRef.current);
    const requestId = ++requestIdRef.current;
    timerRef.current = setTimeout(async () => {
      try {
        const result = await evaluateResponseQualityApi(
          formId,
          buildEvaluatePayload({
            formId,
            screenId,
            fieldKind,
            question,
            helperText,
            answerText: trimmed,
            options,
          }),
        );
        if (requestId !== requestIdRef.current) return;
        setEvaluation(normalizeApiEvaluation(result) ?? runHeuristics());
      } catch {
        if (requestId !== requestIdRef.current) return;
        setEvaluation(runHeuristics());
      }
    }, debounceMs);

    return () => clearTimeout(timerRef.current);
  }, [
    enabled,
    options,
    fieldKind,
    question,
    helperText,
    answerText,
    formId,
    screenId,
    debounceMs,
  ]);

  return evaluation;
}

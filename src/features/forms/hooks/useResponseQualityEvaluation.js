import { useEffect, useRef, useState } from 'react';
import { evaluateResponseQualityApi } from '@/api/services/responseQualityService';
import { isApiConfigured } from '@/config/env';
import { evaluateResponseQuality } from '@/features/forms/utils/responseQualityScoring';

/** Build handoff B.3 evaluate body — flat aliases + nested criteria.enabled blocks. */
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
  const length = options?.length ?? {};
  const specificity = options?.specificity ?? {};
  const relevance = options?.relevance ?? {};
  const completeness = options?.completeness ?? {};
  const topicKeywords = relevance.keywords ?? relevance.topicKeywords ?? '';
  const keywordThreshold = relevance.matchThreshold ?? relevance.keywordThreshold ?? 1;

  return {
    formId: Number(formId),
    screenId: Number(screenId),
    fieldId,
    questionText: question ?? '',
    fieldType,
    helperText: helperText ?? '',
    answerText,
    options: {
      minWords: length.minWords,
      sensitivity: specificity.sensitivity,
      vagueWords: specificity.vagueWords,
      topicKeywords,
      keywordThreshold,
      length,
      specificity,
      relevance: {
        ...relevance,
        topicKeywords,
        keywordThreshold,
      },
      completeness,
      criteria: {
        length,
        specificity,
        relevance: {
          ...relevance,
          topicKeywords,
          keywordThreshold,
        },
        completeness,
      },
    },
  };
}

function normalizeApiEvaluation(result) {
  if (!result?.level) return null;
  const failedIds = Array.isArray(result.failedIds) ? result.failedIds : [];
  const suggestions = Array.isArray(result.suggestions)
    ? result.suggestions.filter((s) => typeof s === 'string' && s.trim()).slice(0, 2)
    : [];
  return {
    level: result.level,
    failCount: failedIds.length,
    message: result.message ?? null,
    failedIds,
    suggestions,
  };
}

function mergeEvaluations(heuristic, apiResult) {
  if (!apiResult) return heuristic;
  if (!heuristic) return apiResult;
  return apiResult;
}

/**
 * Debounced response-quality evaluation — optimistic heuristics, API refine when configured.
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
  const abortRef = useRef(null);

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

    setEvaluation(runHeuristics());

    if (!isApiConfigured() || formId == null || screenId == null) {
      return undefined;
    }

    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    const requestId = ++requestIdRef.current;
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
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
          { signal: controller.signal },
        );
        if (requestId !== requestIdRef.current) return;
        const apiEval = normalizeApiEvaluation(result);
        setEvaluation((prev) => mergeEvaluations(prev ?? runHeuristics(), apiEval));
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (requestId !== requestIdRef.current) return;
        setEvaluation(runHeuristics());
      }
    }, debounceMs);

    return () => {
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
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

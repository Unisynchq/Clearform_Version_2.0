import { useEffect, useRef, useState } from 'react';
import { evaluateResponseQualityApi } from '@/api/services/responseQualityService';
import { isApiConfigured } from '@/config/env';
import { evaluateResponseQuality } from '@/features/forms/utils/responseQualityScoring';

/**
 * Stable per-tab, per-form respondent session id — lets the backend track
 * shown suggestions / trial usage across keystrokes without any auth.
 */
export function getQualitySessionId(formId) {
  if (typeof window === 'undefined' || !window.sessionStorage) return undefined;
  const key = `cf_qsession_${formId}`;
  try {
    let id = window.sessionStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Build handoff B.3 evaluate body — flat aliases + nested criteria.enabled blocks. */
function buildEvaluatePayload({
  formId,
  screenId,
  fieldKind,
  question,
  helperText,
  answerText,
  options,
  conversationHistory,
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
    sessionId: getQualitySessionId(formId),
    questionText: question ?? '',
    fieldType,
    helperText: helperText ?? '',
    answerText,
    conversationHistory: conversationHistory ?? [],
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
  const followUpQuestion =
    result.level !== 'green' && typeof result.followUpQuestion === 'string' && result.followUpQuestion.trim()
      ? result.followUpQuestion.trim()
      : null;
  return {
    level: result.level,
    failCount: failedIds.length,
    message: result.message ?? null,
    failedIds,
    suggestions,
    followUpQuestion,
  };
}

function mergeEvaluations(heuristic, apiResult) {
  if (!apiResult) return heuristic;
  if (!heuristic) return apiResult;
  return apiResult;
}

/**
 * Debounced response-quality evaluation — waits for API result before showing feedback.
 * Falls back to heuristics only if the API is unavailable or returns an error.
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
  conversationHistory,
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
      evaluateResponseQuality(trimmed, {
        enabled,
        options,
        fieldKind,
        question,
        helperText,
      });

    if (!isApiConfigured() || formId == null || screenId == null) {
      setEvaluation(runHeuristics());
      return undefined;
    }

    // Don't show heuristic result immediately — wait for the API so we never
    // flicker from one evaluation to another. Clear any stale result while waiting.
    setEvaluation(null);

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
            conversationHistory,
          }),
          { signal: controller.signal },
        );
        if (requestId !== requestIdRef.current) return;
        const apiEval = normalizeApiEvaluation(result);
        setEvaluation(mergeEvaluations(null, apiEval));
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
    conversationHistory,
    debounceMs,
  ]);

  return evaluation;
}

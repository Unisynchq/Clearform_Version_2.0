import { useEffect, useRef, useState } from 'react';
import { evaluateResponseQualityApi } from '@/api/services/responseQualityService';
import { isApiConfigured } from '@/config/env';

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
  maxChars,
}) {
  const fieldType = fieldKind === 'longText' ? 'Long text' : 'Short text';
  const fieldId = fieldKind === 'longText' ? 'long-text' : 'short-text';
  const length = options?.length ?? {};
  const specificity = options?.specificity ?? {};
  const relevance = options?.relevance ?? {};
  const completeness = options?.completeness ?? {};
  const topicKeywords = relevance.keywords ?? relevance.topicKeywords ?? '';
  const keywordThreshold = relevance.matchThreshold ?? relevance.keywordThreshold ?? 1;
  const customInstructions =
    typeof options?.customInstructions === 'string'
      ? options.customInstructions.trim()
      : '';
  const trimmedAnswer = String(answerText ?? '').trim();

  return {
    screenId: screenId != null ? String(screenId) : undefined,
    fieldId,
    sessionId: getQualitySessionId(formId),
    questionText: question ?? '',
    fieldType,
    helperText: helperText ?? '',
    answerText: trimmedAnswer,
    answerCharCount: trimmedAnswer.length,
    maxChars: maxChars != null && maxChars > 0 ? maxChars : undefined,
    conversationHistory: conversationHistory ?? [],
    customInstructions: customInstructions || undefined,
    options: {
      customInstructions,
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

function parseServiceError(err) {
  const body = err?.body ?? {};
  const code = body.code ?? (err?.status === 403 ? 'UPGRADE_REQUIRED' : 'AI_SERVICE_UNAVAILABLE');
  const message =
    body.message ??
    err?.message ??
    'AI coaching is temporarily unavailable. Please try again in a moment.';
  return {
    code,
    message,
    upgradeRequired: code === 'UPGRADE_REQUIRED',
    status: err?.status,
  };
}

/**
 * Debounced response-quality evaluation — waits for API result before showing feedback.
 * No local heuristic fallback: errors surface as serviceError for the UI.
 *
 * @returns {{ evaluation: object|null, isLoading: boolean, serviceError: object|null }}
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
  maxChars,
  debounceMs = 400,
  previewMode = false,
}) {
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceError, setServiceError] = useState(null);
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!enabled || !options) {
      setEvaluation(null);
      setServiceError(null);
      setIsLoading(false);
      return undefined;
    }

    const trimmed = String(answerText ?? '').trim();
    if (!trimmed) {
      setEvaluation(null);
      setServiceError(null);
      setIsLoading(false);
      return undefined;
    }

    const formIdReady = formId != null && String(formId).length > 0;
    if (!isApiConfigured() || !formIdReady || screenId == null) {
      setEvaluation(null);
      setServiceError({
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI coaching is unavailable — connect the API to enable live feedback.',
        upgradeRequired: false,
      });
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setServiceError(null);

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
            maxChars,
          }),
          { signal: controller.signal },
        );
        if (requestId !== requestIdRef.current) return;
        const apiEval = normalizeApiEvaluation(result);
        if (apiEval) {
          setEvaluation(apiEval);
          setServiceError(null);
        } else {
          setEvaluation(null);
          setServiceError({
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'AI coaching returned an empty response. Please try again.',
            upgradeRequired: false,
          });
        }
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (requestId !== requestIdRef.current) return;
        setEvaluation(null);
        setServiceError(parseServiceError(err));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, previewMode ? Math.max(debounceMs, 900) : debounceMs);

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
    maxChars,
    debounceMs,
    previewMode,
  ]);

  return { evaluation, isLoading, serviceError };
}

import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

/**
 * Live response-quality scoring — POST /forms/:formId/response-quality/evaluate
 * @see BACKEND_HANDOFF.md
 */
export async function evaluateResponseQualityApi(formId, body, { signal } = {}) {
  if (!isApiConfigured() || formId == null) {
    return null;
  }
  return apiClient(API_ENDPOINTS.responseQuality.evaluate(formId), {
    method: 'POST',
    body,
    signal,
    timeoutMs: 20_000,
  });
}

/** Owner-only — polish response-quality customInstructions draft. */
export async function improveResponseQualityInstructionsApi(
  formId,
  body,
  { signal } = {},
) {
  if (!isApiConfigured() || formId == null) {
    return null;
  }
  return apiClient(API_ENDPOINTS.responseQuality.improveInstructions(formId), {
    method: 'POST',
    body,
    signal,
    timeoutMs: 30_000,
  });
}

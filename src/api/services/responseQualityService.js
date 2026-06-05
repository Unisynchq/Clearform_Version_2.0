import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

/**
 * Live response-quality scoring — POST /forms/:formId/response-quality/evaluate
 * @see BACKEND_HANDOFF.md
 */
export async function evaluateResponseQualityApi(formId, body) {
  if (!isApiConfigured() || formId == null) {
    return null;
  }
  return apiClient(API_ENDPOINTS.responseQuality.evaluate(formId), {
    method: 'POST',
    body,
  });
}

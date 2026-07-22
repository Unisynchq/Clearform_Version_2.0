import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

/**
 * Submit a thumbs-up (rating: 1) or thumbs-down (rating: -1) on an AI quality decision.
 * Only form builders (authenticated) can submit this.
 */
export async function submitAiFeedback(formId, responseId, { screenId, rating, aiDecision, actualAnswer, note } = {}) {
  return apiClient(API_ENDPOINTS.aiFeedback.create(formId, responseId), {
    method: 'POST',
    body: { screenId, rating, aiDecision, actualAnswer, note },
  });
}

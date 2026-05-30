import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

export async function submitResponse(formId, data) {
  return apiClient(API_ENDPOINTS.responses.list(formId), {
    method: 'POST',
    body: { formId: String(formId), data },
  });
}

export async function listResponses(formId) {
  return apiClient(API_ENDPOINTS.responses.list(formId));
}

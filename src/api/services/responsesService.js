import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { appendFormResponse } from '@/features/forms/utils/formResponsesStorage';

export async function submitFormResponse(formId, response) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.responses.create(formId), {
      method: 'POST',
      body: response,
    });
  }
  appendFormResponse(response);
  return response;
}

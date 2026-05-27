import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { buildLocalAiLogicSuggestion } from '@/features/forms/utils/applyAiLogicResult';

/**
 * AI logic generation — stubbed locally until backend endpoint is ready.
 */
export async function generateFormLogic(formId, context) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.logic.generate(formId), {
      method: 'POST',
      body: context,
    });
  }
  await new Promise((r) => setTimeout(r, 700));
  return buildLocalAiLogicSuggestion(context);
}

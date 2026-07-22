import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { buildLocalAiLogicSuggestion } from '@/features/forms/utils/applyAiLogicResult';

/**
 * Serialize the builder context for the API. Builder screens keep the block
 * type in `label` ("Long text"); the AI needs the actual question text, so
 * resolve it via `getQuestionText` before the function is lost to JSON.
 */
function buildGenerateLogicBody(context) {
  const resolveLabel = (screen) => {
    const text =
      typeof context.getQuestionText === 'function'
        ? context.getQuestionText(screen)
        : '';
    return text || screen.name || screen.label || `Question ${screen.id}`;
  };
  return {
    screens: context.screens,
    contentScreens: (context.contentScreens ?? []).map((screen) => ({
      id: screen.id,
      label: resolveLabel(screen),
    })),
  };
}

/**
 * AI logic generation — stubbed locally until backend endpoint is ready.
 */
export async function generateFormLogic(formId, context) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.logic.generate(formId), {
      method: 'POST',
      body: buildGenerateLogicBody(context),
    });
  }
  await new Promise((r) => setTimeout(r, 700));
  return buildLocalAiLogicSuggestion(context);
}

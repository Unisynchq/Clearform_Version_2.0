import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { appendFormResponse } from '@/features/forms/utils/formResponsesStorage';
import { store } from '@/store/store';
import { addFormResponse, loadFormsFromApi } from '@/store/slices/formsSlice';

/** Handoff B.2 — prefer answersByScreenId when snaps are available */
function toSubmissionBody(response, snapsByScreenId) {
  const submittedAt = response?.submittedAt ?? new Date().toISOString();
  if (snapsByScreenId && Object.keys(snapsByScreenId).length > 0) {
    const answersByScreenId = {};
    for (const [screenId, snap] of Object.entries(snapsByScreenId)) {
      answersByScreenId[screenId] = snap;
    }
    return {
      submittedAt,
      completed: response?.status === 'completed',
      contact: response?.contact,
      answers: response?.answers,
      answersByScreenId,
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      },
    };
  }
  const { answers, contact, status, startedAt } = response ?? {};
  return {
    data: {
      answers: answers ?? [],
      contact: contact ?? '—',
      submittedAt,
      ...(startedAt ? { startedAt } : {}),
      ...(status ? { status } : {}),
    },
  };
}

export async function submitFormResponse(formId, response, snapsByScreenId) {
  if (isApiConfigured()) {
    const result = await apiClient(API_ENDPOINTS.responses.create(formId), {
      method: 'POST',
      body: toSubmissionBody(response, snapsByScreenId),
    });
    store.dispatch(addFormResponse({ ...response, formId }));
    store.dispatch(loadFormsFromApi());
    return result;
  }
  appendFormResponse(response);
  return response;
}

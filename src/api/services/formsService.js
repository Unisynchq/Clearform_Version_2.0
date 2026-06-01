import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { readBuilderDraft, writeBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import { readPublishedForm, writePublishedForm } from '@/features/forms/utils/publishedFormStorage';
import { readPersistedForms } from '@/features/forms/utils/userFormsStorage';

/**
 * Forms API facade — today reads/writes localStorage when API is not configured.
 * Swap implementations per method when backend is live (keep return shapes stable).
 */

export async function listForms() {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.list);
  }
  return readPersistedForms();
}

export async function createForm({ title, workspaceId, gradientFrom, gradientTo, overlayColor, iconGradient }) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.list, {
      method: 'POST',
      body: { title, workspaceId, gradientFrom, gradientTo, overlayColor, iconGradient },
    });
  }
  return {
    id: Date.now(),
    title,
    status: 'draft',
    workspace: workspaceId ?? null,
    responses: 0,
    timeAgo: 'just now',
    gradientFrom,
    gradientTo,
    overlayColor,
    iconGradient,
  };
}

export async function patchForm(formId, body) {
  if (isApiConfigured()) {
    return apiClient(`${API_ENDPOINTS.forms.list}/${formId}`, {
      method: 'PATCH',
      body,
    });
  }
  return null;
}

export async function getBuilderSnapshot(formId) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.builderSnapshot(formId));
  }
  return readBuilderDraft(formId);
}

export async function saveBuilderSnapshot(formId, snapshot) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.builderSnapshot(formId), {
      method: 'PUT',
      body: snapshot,
    });
  }
  writeBuilderDraft(formId, snapshot);
  return snapshot;
}

export async function publishForm(formId, snapshot) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.publish(formId), {
      method: 'POST',
      body: snapshot,
    });
  }
  writePublishedForm(formId, snapshot);
  return { formId, status: 'live', publishedAt: Date.now() };
}

export async function getPublishedForm(formId) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.published(formId));
  }
  return readPublishedForm(formId);
}

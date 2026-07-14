import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { readBuilderDraft, writeBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import { readPublishedForm, writePublishedForm } from '@/features/forms/utils/publishedFormStorage';
import {
  clearPublishedFormSessionCache,
  readPublishedFormSessionCache,
  writePublishedFormSessionCache,
} from '@/features/forms/utils/publishedFormSessionCache';
import { readPersistedForms } from '@/features/forms/utils/userFormsStorage';
import { trackFormCreated } from '@/analytics/track';

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
  let created;
  if (isApiConfigured()) {
    created = await apiClient(API_ENDPOINTS.forms.list, {
      method: 'POST',
      body: { title, workspaceId, gradientFrom, gradientTo, overlayColor, iconGradient },
    });
  } else {
    created = {
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
  trackFormCreated({ formId: created?.id });
  return created;
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

/** Soft-delete (trash) or hard-delete when already in trash — see backend forms.service.remove */
export async function deleteForm(formId) {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.byId(formId), { method: 'DELETE' });
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
  clearPublishedFormSessionCache(formId);
  if (isApiConfigured()) {
    const result = await apiClient(API_ENDPOINTS.forms.publish(formId), {
      method: 'POST',
      body: snapshot,
    });
    writePublishedFormSessionCache(formId, snapshot);
    return result;
  }
  writePublishedForm(formId, snapshot);
  writePublishedFormSessionCache(formId, snapshot);
  return { formId, status: 'live', publishedAt: Date.now() };
}

export async function getPublishedForm(formId) {
  if (isApiConfigured()) {
    const cached = readPublishedFormSessionCache(formId);
    try {
      const fresh = await apiClient(API_ENDPOINTS.forms.published(formId));
      if (fresh?.screens?.length) {
        writePublishedFormSessionCache(formId, fresh);
        return fresh;
      }
    } catch (err) {
      if (cached?.snapshot) return cached.snapshot;
      throw err;
    }
    return cached?.snapshot ?? null;
  }
  return readPublishedForm(formId);
}

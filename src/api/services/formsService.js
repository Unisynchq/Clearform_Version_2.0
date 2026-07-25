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
 * Forms API facade — reads/writes localStorage only when API is not configured.
 * When API is configured, the database is the single source of truth.
 */

export async function listForms(status) {
  if (isApiConfigured()) {
    const url = status ? `${API_ENDPOINTS.forms.list}?status=${status}` : API_ENDPOINTS.forms.list;
    return apiClient(url);
  }
  return readPersistedForms();
}

export async function getForm(formId) {
  if (isApiConfigured() && typeof formId !== 'number') {
    return apiClient(API_ENDPOINTS.forms.byId(formId));
  }
  const forms = readPersistedForms();
  return forms.find((f) => Number(f.id) === Number(formId)) ?? null;
}

export async function createForm({ title, workspaceId, gradientFrom, gradientTo, overlayColor, iconGradient, ownerEmail }) {
  let created;
  if (isApiConfigured()) {
    created = await apiClient(API_ENDPOINTS.forms.list, {
      method: 'POST',
      body: { title, workspaceId, gradientFrom, gradientTo, overlayColor, iconGradient, ownerEmail },
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
  if (isApiConfigured() && typeof formId !== 'number') {
    return apiClient(`${API_ENDPOINTS.forms.list}/${formId}`, {
      method: 'PATCH',
      body,
    });
  }
  return null;
}

/** Soft-delete (trash) or hard-delete when already in trash — see backend forms.service.remove */
export async function deleteForm(formId) {
  if (isApiConfigured() && typeof formId !== 'number') {
    return apiClient(API_ENDPOINTS.forms.byId(formId), { method: 'DELETE' });
  }
  return null;
}

export async function pauseForm(formId, isPaused) {
  if (isApiConfigured() && typeof formId !== 'number') {
    return apiClient(`${API_ENDPOINTS.forms.list}/${formId}/pause`, {
      method: 'PATCH',
      body: { isPaused },
    });
  }
  return null;
}

export async function getTrashForms() {
  if (isApiConfigured()) {
    return apiClient(API_ENDPOINTS.forms.trash);
  }
  return [];
}

export async function restoreForm(formId) {
  if (isApiConfigured() && typeof formId !== 'number') {
    return apiClient(`${API_ENDPOINTS.forms.list}/${formId}/restore`, {
      method: 'PATCH',
    });
  }
  return null;
}

export async function permanentDeleteForm(formId) {
  if (isApiConfigured() && typeof formId !== 'number') {
    return apiClient(`${API_ENDPOINTS.forms.list}/${formId}/permanent`, {
      method: 'DELETE',
    });
  }
  return null;
}

export async function getBuilderSnapshot(formId) {
  if (isApiConfigured() && typeof formId !== 'number') {
    return apiClient(API_ENDPOINTS.forms.builderSnapshot(formId));
  }
  return readBuilderDraft(formId);
}

export async function saveBuilderSnapshot(formId, snapshot) {
  if (isApiConfigured() && typeof formId !== 'number') {
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
  if (isApiConfigured() && typeof formId !== 'number') {
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
  if (isApiConfigured() && typeof formId !== 'number') {
    try {
      const fresh = await apiClient(API_ENDPOINTS.forms.published(formId));
      // If form is paused, clear any cached snapshot so we never serve stale data
      if (fresh?._paused === true || fresh?.isPaused === true) {
        clearPublishedFormSessionCache(formId);
        return fresh?.snapshot ?? fresh;
      }
      // Cache live snapshot for performance (cleared on publish/unpublish/pause)
      if (fresh?.screens?.length) {
        writePublishedFormSessionCache(formId, fresh);
      }
      return fresh;
    } catch (err) {
      // On network error, try session cache (not paused, not stale)
      const cached = readPublishedFormSessionCache(formId);
      if (cached?.snapshot && !cached.snapshot._paused) return cached.snapshot;
      throw err;
    }
  }
  return readPublishedForm(formId);
}

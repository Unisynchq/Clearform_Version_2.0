import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { env, isApiConfigured } from '@/config/env';
import { appendFormResponse } from '@/features/forms/utils/formResponsesStorage';
import { store } from '@/store/store';
import { addFormResponse, loadFormsFromApi } from '@/store/slices/formsSlice';

/** Upload a respondent file to durable storage (public HTTPS URL). */
export async function uploadResponseFile(formId, file) {
  if (!isApiConfigured()) {
    throw new Error('API is not configured');
  }
  const formData = new FormData();
  formData.append('file', file);
  return apiClient(API_ENDPOINTS.responses.uploadFile(formId), {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

/** Replace blob: URLs in upload snaps with hosted file metadata before submit. */
async function persistBlobUploadFiles(formId, snapsByScreenId) {
  if (!snapsByScreenId || !isApiConfigured()) return snapsByScreenId ?? {};

  const out = { ...snapsByScreenId };
  for (const [screenId, snap] of Object.entries(snapsByScreenId)) {
    const files = snap?.uploadedFiles;
    if (!Array.isArray(files) || files.length === 0) continue;

    let changed = false;
    const uploadedFiles = await Promise.all(
      files.map(async (f) => {
        const url = f?.url ?? f?.downloadUrl;
        if (typeof url !== 'string' || !url.startsWith('blob:')) return f;

        changed = true;
        const resp = await fetch(url);
        const blob = await resp.blob();
        const upload = new File([blob], f.name || 'upload', {
          type: f.type || blob.type || 'application/octet-stream',
        });
        const meta = await uploadResponseFile(formId, upload);
        return {
          ...f,
          id: f.id ?? meta.storagePath,
          name: meta.name ?? f.name,
          url: meta.url,
          downloadUrl: meta.url,
          size: meta.size ?? f.size,
          type: meta.type ?? f.type,
          storagePath: meta.storagePath,
          uploadedAt: f.uploadedAt ?? new Date().toISOString(),
        };
      }),
    );

    if (changed) {
      out[screenId] = { ...snap, uploadedFiles };
    }
  }
  return out;
}

/** Handoff B.2 — prefer answersByScreenId when snaps are available */
function toSubmissionBody(response, snapsByScreenId) {
  const submittedAt = response?.submittedAt ?? new Date().toISOString();
  if (snapsByScreenId && Object.keys(snapsByScreenId).length > 0) {
    const answersByScreenId = {};
    for (const [screenId, snap] of Object.entries(snapsByScreenId)) {
      answersByScreenId[screenId] = snap;
    }
    const metadata = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    };
    if (typeof response?.durationMs === 'number' && response.durationMs >= 0) {
      metadata.durationMs = Math.round(response.durationMs);
    }
    if (response?.startedAt) {
      metadata.startedAt = response.startedAt;
    }
    if (response?.screenTimestamps && typeof response.screenTimestamps === 'object') {
      metadata.screenTimestamps = response.screenTimestamps;
    }
    return {
      submittedAt,
      completed: response?.status === 'completed',
      contact: response?.contact,
      answers: response?.answers,
      answersByScreenId,
      metadata,
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

/**
 * Fires a fire-and-forget beacon when the user leaves mid-form.
 * Uses sendBeacon so the request survives page unload.
 */
export function sendAbandonBeacon(formId, snapsByScreenId, abandonedAtScreenId, startedAtMs) {
  if (!isApiConfigured() || typeof navigator?.sendBeacon !== 'function') return;
  const path = API_ENDPOINTS.responses.create(formId);
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const now = Date.now();
  const payload = {
    submittedAt: new Date(now).toISOString(),
    completed: false,
    abandonedAtScreenId: abandonedAtScreenId ?? null,
    answersByScreenId: snapsByScreenId ?? {},
    metadata: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      durationMs: Math.max(0, now - (startedAtMs ?? now)),
      startedAt: new Date(startedAtMs ?? now).toISOString(),
    },
  };
  navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
}

export async function submitFormResponse(formId, response, snapsByScreenId) {
  if (isApiConfigured()) {
    const persistedSnaps = await persistBlobUploadFiles(formId, snapsByScreenId);
    const result = await apiClient(API_ENDPOINTS.responses.create(formId), {
      method: 'POST',
      body: toSubmissionBody(response, persistedSnaps),
    });
    store.dispatch(addFormResponse({ ...response, formId }));
    store.dispatch(loadFormsFromApi());
    return result;
  }
  appendFormResponse(response);
  return response;
}

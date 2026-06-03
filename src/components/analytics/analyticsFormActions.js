import { deleteForm as deleteFormApi } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { clearFormLocalCaches } from '@/features/forms/utils/clearFormLocalCaches';

const DEFAULT_MS = 1500;

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

export function shouldFailFormAction() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('formAction') === 'fail';
}

export async function pauseFormRequest({ signal, forceFail } = {}) {
  await delay(DEFAULT_MS + Math.random() * 500, signal);
  if (forceFail ?? shouldFailFormAction()) {
    throw new Error('Failed to pause form');
  }
}

export async function deleteFormRequest({ formId, signal, forceFail } = {}) {
  if (forceFail ?? shouldFailFormAction()) {
    throw new Error('Failed to delete form');
  }
  if (isApiConfigured()) {
    if (!formId) throw new Error('Form id is required');
    await deleteFormApi(formId);
    clearFormLocalCaches(formId);
    return;
  }
  await delay(DEFAULT_MS + Math.random() * 600, signal);
}

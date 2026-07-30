import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { readAuthSession } from '@/features/auth/utils/authStorage';

const ONBOARDING_SYNC_PREFIX = 'clearform:onboarding-complete-sync:';

function getOnboardingSyncKey() {
  const email = readAuthSession()?.email?.trim().toLowerCase();
  return `${ONBOARDING_SYNC_PREFIX}${email || 'anonymous'}`;
}

let onboardingCompletionPromise = null;

/**
 * Load DB-backed profile after Supabase sign-in (onboarding flag, plan).
 */
export async function fetchMe() {
  if (!isApiConfigured()) return null;
  try {
    return await apiClient(API_ENDPOINTS.auth.me);
  } catch (err) {
    if (err?.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function markOnboardingCompleteOnServer() {
  if (!isApiConfigured()) return null;
  if (typeof window !== 'undefined') {
    const syncKey = getOnboardingSyncKey();
    if (sessionStorage.getItem(syncKey) === '1') {
      return null;
    }
    if (onboardingCompletionPromise) {
      return onboardingCompletionPromise;
    }
    onboardingCompletionPromise = apiClient('/auth/me/onboarding-complete', {
      method: 'PATCH',
      body: {},
    })
      .then((result) => {
        sessionStorage.setItem(syncKey, '1');
        return result;
      })
      .finally(() => {
        onboardingCompletionPromise = null;
      });
    return onboardingCompletionPromise;
  }
  return apiClient('/auth/me/onboarding-complete', {
    method: 'PATCH',
    body: {},
  });
}

export async function updateMe(body) {
  if (!isApiConfigured()) return null;
  return apiClient(API_ENDPOINTS.auth.me, {
    method: 'PATCH',
    body,
  });
}

export async function uploadAvatar(file) {
  if (!isApiConfigured()) return null;
  const formData = new FormData();
  formData.append('file', file);
  return apiClient('/auth/me/avatar', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function deleteAccount() {
  if (!isApiConfigured()) {
    throw new Error('Account deletion requires API configuration');
  }
  return apiClient(API_ENDPOINTS.auth.me, { method: 'DELETE' });
}

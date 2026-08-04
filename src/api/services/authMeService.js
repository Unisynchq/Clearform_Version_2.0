import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { supabase } from '@/config/supabase';
import * as sessionStorageSafe from '@/utils/sessionStorageSafe';

const ONBOARDING_SYNC_PREFIX = 'clearform:onboarding-complete-sync:';

async function getOnboardingSyncKey() {
  let email = 'anonymous';
  try {
    const { data } = await supabase?.auth.getSession();
    const fromSession = data?.session?.user?.email?.trim()?.toLowerCase();
    if (fromSession) email = fromSession;
  } catch {
    // ignore
  }
  return `${ONBOARDING_SYNC_PREFIX}${email}`;
}

let onboardingCompletionPromise = null;

/**
 * Load DB-backed profile after Supabase sign-in (onboarding flag, plan).
 * Auth: Bearer from Supabase getSession (see apiClient / getFreshAuthToken).
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
    const syncKey = await getOnboardingSyncKey();
    if (sessionStorageSafe.getItem(syncKey) === '1') {
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
        sessionStorageSafe.setItem(syncKey, '1');
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

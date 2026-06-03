import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

/**
 * Load DB-backed profile after Firebase sign-in (onboarding flag, plan).
 */
export async function fetchMe() {
  if (!isApiConfigured()) return null;
  return apiClient(API_ENDPOINTS.auth.me);
}

export async function markOnboardingCompleteOnServer() {
  if (!isApiConfigured()) return null;
  return apiClient('/auth/me/onboarding-complete', {
    method: 'PATCH',
    body: {},
  });
}

/** Permanently deletes the authenticated user and associated data. */
export async function deleteAccount() {
  if (!isApiConfigured()) {
    throw new Error('Account deletion requires API configuration.');
  }
  return apiClient(API_ENDPOINTS.auth.me, { method: 'DELETE' });
}

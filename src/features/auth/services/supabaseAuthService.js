import { apiClient, ApiError } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { fetchMe } from '@/api/services/authMeService';
import { supabase, isSupabaseConfigured } from '@/config/supabase';
import {
  beginAuthLogout,
  endAuthLogout,
  clearLogoutMarker,
  isAuthLogoutInProgress,
  runSingleFlightSync,
  resetAuthRestoreCoordinator,
} from '@/features/auth/utils/authBootstrapCoordinator';
import {
  clearAuthClientContext,
  writeOnboardingHint,
} from '@/features/auth/utils/authClientContext';
import { resetAuthBootstrapCoordinator } from '@/features/auth/utils/authBootstrapCoordinator';
import {
  identifyUser,
  resetAnalytics,
  trackSignIn,
  trackSignup,
} from '@/analytics/track';
import { clearAllAppStorage } from '@/utils/clearAppStorage';
import * as sessionStorageSafe from '@/utils/sessionStorageSafe';

// Unused constants removed
export const AUTH_RETURN_TO_KEY = 'clearform:auth-return-to';
export const AUTH_REDIRECT_PENDING_KEY = 'clearform:auth-redirect-pending';
const SUPABASE_MFA_PROVIDER = import.meta.env.VITE_SUPABASE_MICROSOFT_PROVIDER || 'azure';

let backendSyncPromise = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidReturnTo(returnTo) {
  return typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//');
}

// Removed getCurrentToken function

async function fetchMeWithRetry() {
  try {
    return await fetchMe();
  } catch (error) {
    if (error instanceof ApiError && error.status >= 500) {
      await delay(400);
      return await fetchMe();
    }
    throw error;
  }
}

async function getSupabaseSession() {
  if (!supabase || isAuthLogoutInProgress()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session ?? null;
}

function userNameFromSession(user) {
  return {
    firstName: user?.user_metadata?.first_name ?? '',
    lastName: user?.user_metadata?.last_name ?? '',
  };
}

function captureAuthAnalytics(payload, authUser, { isNewUser, method, trackAuth }) {
  identifyUser({
    id: payload?.user?.id,
    uid: authUser?.id,
    email: payload?.email ?? authUser?.email,
    firstName: payload?.firstName,
    lastName: payload?.lastName,
  });

  if (!trackAuth) return;
  const email = payload?.email ?? authUser?.email;
  if (isNewUser) trackSignup({ method, email });
  else trackSignIn({ method, email });
}

async function syncUserWithBackend() {
  if (isAuthLogoutInProgress()) return null;
  if (backendSyncPromise) return backendSyncPromise;

  const run = async () => {
    try {
      const response = await fetchMeWithRetry();
      const user = response?.user;
      if (user) {
        writeOnboardingHint(user.onboardingCompleted);
      }
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthClientContext();
      }
      // If the backend is down or not reachable, keep the Supabase session alive.
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[clearform:auth] backend sync skipped', error);
      }
      return null;
    }
  };

  backendSyncPromise = runSingleFlightSync(run).finally(() => {
    backendSyncPromise = null;
  });

  return backendSyncPromise;
}

async function syncFromSession(session, { method = 'session', isNewUser = false, trackAuth = false } = {}) {
  if (isAuthLogoutInProgress()) return null;
  if (!session?.user?.email) return null;

  const backend = await syncUserWithBackend();
  const { firstName, lastName } = userNameFromSession(session.user);
  const payload = {
    email: session.user.email,
    firstName,
    lastName,
    isNewUser,
    ...(backend ?? {}),
  };
  captureAuthAnalytics(payload, session.user, { isNewUser, method, trackAuth });
  return payload;
}

// Removed custom storeToken and clearToken

export async function signUpWithEmail(email, password, firstName, lastName) {
  clearLogoutMarker();
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) throw new Error(error.message);
  
  return syncPayloadFromResponse({ user: data.user }, {
    isNewUser: true,
    method: 'email',
    trackAuth: true,
  });
}

export async function signInWithEmail(email, password) {
  clearLogoutMarker();
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return syncPayloadFromResponse({ user: data.user }, {
    isNewUser: false,
    method: 'email',
    trackAuth: true,
  });
}

async function syncPayloadFromResponse(
  response,
  { isNewUser = false, method = 'session', trackAuth = false } = {},
) {
  const user = response?.user;
  if (!user) return null;
  const backend = await syncUserWithBackend();
  const payload = {
    email: user.email,
    firstName: user.user_metadata?.first_name ?? user.firstName ?? '',
    lastName: user.user_metadata?.last_name ?? user.lastName ?? '',
    isNewUser,
    ...backend,
  };
  captureAuthAnalytics(payload, user, { isNewUser, method, trackAuth });
  return payload;
}

export async function signOutUser() {
  beginAuthLogout();
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  try {
    if (token) {
      try {
        await apiClient(API_ENDPOINTS.auth.signOut, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Best-effort logout; local session is cleared regardless.
      }
    }

    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {
    // Ignore Supabase sign-out failures and continue clearing local state.
  } finally {
    try {
      clearAuthClientContext();
      resetAuthBootstrapCoordinator();
      resetAuthRestoreCoordinator();
      resetAnalytics();

      if (typeof window !== 'undefined') {
        clearAllAppStorage();
        sessionStorageSafe.clear();
      }
    } finally {
      endAuthLogout();
    }
  }
}

export async function requestPasswordResetEmail(email) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

export async function updateUserPasswordInSupabase(currentPassword, newPassword) {
  return apiClient('/auth/me/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export async function resetPasswordWithToken(newPassword) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function signInWithGoogle(returnTo) {
  clearLogoutMarker();
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Google sign-in requires Supabase configuration.');
  }

  const redirectPath = isValidReturnTo(returnTo) ? returnTo : '/dashboard';
  if (isValidReturnTo(returnTo)) {
    sessionStorageSafe.setItem(AUTH_RETURN_TO_KEY, returnTo);
  }
  sessionStorageSafe.setItem(AUTH_REDIRECT_PENDING_KEY, 'google');

  // CLE-46: full-page redirect — popup + COOP left session set but parent stuck on /signin.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Browser navigates away to Google; this usually never returns.
  return data ?? null;
}

async function signInWithMicrosoftOAuth(returnTo) {
  clearLogoutMarker();
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Microsoft sign-in requires Supabase configuration.');
  }

  const redirectPath = isValidReturnTo(returnTo) ? returnTo : '/dashboard';
  if (isValidReturnTo(returnTo)) {
    sessionStorageSafe.setItem(AUTH_RETURN_TO_KEY, returnTo);
  }
  sessionStorageSafe.setItem(AUTH_REDIRECT_PENDING_KEY, 'microsoft');

  // Supabase requires a real email from Azure; without `email` scope Microsoft only
  // returns an anonymous subject and Auth fails with:
  // "Error getting user email from external provider"
  // CLE-46: full-page redirect (same as Google) so post-auth navigation always runs.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: SUPABASE_MFA_PROVIDER,
    options: {
      scopes: 'email openid profile',
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function startMicrosoftSignInRedirect(returnTo) {
  return signInWithMicrosoftOAuth(returnTo);
}

export async function startMicrosoftSignInPopup(returnTo) {
  return signInWithMicrosoftOAuth(returnTo);
}

export async function signInWithMicrosoft(returnTo) {
  return signInWithMicrosoftOAuth(returnTo);
}

export async function restoreSession() {
  if (isAuthLogoutInProgress()) return null;
  const session = await getSupabaseSession();
  if (session?.user?.email) {
    const payload = await syncFromSession(session, {
      method: 'session',
      isNewUser: false,
      trackAuth: false,
    });
    if (payload) return payload;
  }

  const response = await fetchMe();
  if (!response?.user) return null;

  const payload = {
    email: response.user.email,
    firstName: response.user.firstName,
    lastName: response.user.lastName,
    isNewUser: false,
    ...response.user,
  };

  captureAuthAnalytics(payload, response.user, {
    isNewUser: false,
    method: 'session',
    trackAuth: false,
  });
  return payload;
}

export async function consumeRedirectSignInResult() {
  if (isAuthLogoutInProgress()) return null;
  const session = await getSupabaseSession();
  if (!session?.user?.email) return null;
  const payload = await syncFromSession(session, {
    method: session?.provider ?? 'oauth',
    isNewUser: false,
    trackAuth: false,
  });
  if (payload) resetRedirectSignInConsumption();
  return payload;
}



export function getMicrosoftRedirectNullErrorMessage() {
  return 'Microsoft sign-in could not be completed. Please try again.';
}

export function resetRedirectSignInConsumption() {
  sessionStorageSafe.removeItem(AUTH_REDIRECT_PENDING_KEY);
}

export function readAuthReturnTo() {
  const returnTo = sessionStorageSafe.getItem(AUTH_RETURN_TO_KEY);
  sessionStorageSafe.removeItem(AUTH_RETURN_TO_KEY);
  if (isValidReturnTo(returnTo)) {
    return returnTo;
  }
  return undefined;
}

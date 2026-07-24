import { createClient } from '@supabase/supabase-js';
import { fetchMe } from '@/api/services/authMeService';
import { ApiError } from '@/api/client';
import { runSingleFlightSync } from '@/features/auth/utils/authBootstrapCoordinator';
import {
  clearAuthClientContext,
  writeOnboardingHint,
} from '@/features/auth/utils/authClientContext';
import { resetAuthBootstrapCoordinator } from '@/features/auth/utils/authBootstrapCoordinator';
import {
  clearLocalDevToken,
  localSignInWithEmail,
  localSignUpWithEmail,
  rejectLocalOAuth,
} from '@/features/auth/services/localAuthService';
import {
  identifyUser,
  resetAnalytics,
  trackSignIn,
  trackSignup,
} from '@/analytics/track';
import { clearAllAppStorage } from '@/utils/clearAppStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => Boolean(supabase);

const TOKEN_KEY = 'clearform:auth-token';
export const AUTH_RETURN_TO_KEY = 'clearform:auth-return-to';
export const AUTH_REDIRECT_PENDING_KEY = 'clearform:auth-redirect-pending';

let backendSyncPromise = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function syncUserWithBackend() {
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
        await signOutUser();
      }
      throw error;
    }
  };

  backendSyncPromise = runSingleFlightSync(run).finally(() => {
    backendSyncPromise = null;
  });

  return backendSyncPromise;
}

export async function storeToken(sessionOrUser) {
  if (typeof window !== 'undefined' && sessionOrUser?.access_token) {
    localStorage.setItem(TOKEN_KEY, sessionOrUser.access_token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
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

export async function signUpWithEmail(email, password, firstName, lastName) {
  if (!supabase) {
    const user = await localSignUpWithEmail(email, password, firstName, lastName);
    const payload = { ...user, user: null };
    captureAuthAnalytics(payload, null, { isNewUser: true, method: 'email', trackAuth: true });
    return payload;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email, 
    password,
    options: { data: { first_name: firstName, last_name: lastName } }
  });

  if (error) throw new Error(error.message);
  if (data.session) await storeToken(data.session);

  const backend = await syncUserWithBackend();
  const payload = { email: data.user?.email, firstName, lastName, ...backend };
  captureAuthAnalytics(payload, data.user, { isNewUser: true, method: 'email', trackAuth: true });
  return payload;
}

export async function signInWithEmail(email, password) {
  if (!supabase) {
    const user = await localSignInWithEmail(email, password);
    const payload = { ...user, user: null };
    captureAuthAnalytics(payload, null, { isNewUser: false, method: 'email', trackAuth: true });
    return payload;
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (data.session) await storeToken(data.session);

  const firstName = data.user?.user_metadata?.first_name || '';
  const lastName = data.user?.user_metadata?.last_name || '';
  const backend = await syncUserWithBackend();
  
  const payload = { email: data.user?.email, firstName, lastName, ...backend };
  captureAuthAnalytics(payload, data.user, { isNewUser: false, method: 'email', trackAuth: true });
  return payload;
}

export async function signOutUser() {
  clearToken();
  clearLocalDevToken();
  clearAuthClientContext();
  resetAuthBootstrapCoordinator();
  resetAnalytics();
  
  if (typeof window !== 'undefined') {
    clearAllAppStorage();
    sessionStorage.clear();
  }

  if (supabase) await supabase.auth.signOut();
}

export async function requestPasswordResetEmail(email) {
  if (!supabase) throw new Error('Password reset requires Supabase configuration.');
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

export async function restoreSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  
  await storeToken(data.session);
  
  const firstName = data.session.user.user_metadata?.first_name || '';
  const lastName = data.session.user.user_metadata?.last_name || '';
  const backend = await syncUserWithBackend();
  
  const payload = { email: data.session.user.email, firstName, lastName, ...backend };
  captureAuthAnalytics(payload, data.session.user, { isNewUser: false, method: 'session', trackAuth: false });
  return payload;
}

export async function signInWithGoogle(returnTo) {
  if (!supabase) return rejectLocalOAuth();
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/signin'
    }
  });
  if (error) throw new Error(error.message);
}

export async function consumeRedirectSignInResult() {
  return null;
}
export async function startMicrosoftSignInRedirect() { return rejectLocalOAuth(); }
export async function startMicrosoftSignInPopup() { return rejectLocalOAuth(); }
export async function signInWithMicrosoft() { return rejectLocalOAuth(); }
export function readAuthReturnTo() {
  const returnTo = sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return undefined;
}

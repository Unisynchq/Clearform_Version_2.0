import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider, getFirebaseAuthOrigin } from '@/config/firebase';
import { fetchMe } from '@/api/services/authMeService';
import { ApiError } from '@/api/client';
import { isApiConfigured, isFirebaseConfigured } from '@/config/env';
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

const TOKEN_KEY = 'clearform:auth-token';
export const AUTH_RETURN_TO_KEY = 'clearform:auth-return-to';
export const AUTH_REDIRECT_PENDING_KEY = 'clearform:auth-redirect-pending';

const AUTH_LOG_PREFIX = '[clearform:auth]';
const REDIRECT_SETTLE_MS = 400;

let redirectResultPromise = null;
let backendSyncPromise = null;

function isBraveBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /brave/i.test(navigator.userAgent ?? '');
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchMeWithRetry() {
  try {
    return await fetchMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      await delay(300);
      return fetchMe();
    }
    throw error;
  }
}

function logAuthDebug(step, detail = {}) {
  if (typeof console !== 'undefined' && console.info) {
    console.info(AUTH_LOG_PREFIX, step, detail);
  }
}

function logAuthWarn(step, detail = {}) {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(AUTH_LOG_PREFIX, step, detail);
  }
}

/** Wait until Firebase has resolved the initial auth state (authStateReady is unavailable in this SDK). */
function waitForFirebaseAuthInit() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
}

async function storeToken(user) {
  const token = await user.getIdToken();
  sessionStorage.setItem(TOKEN_KEY, token);
}

function parseDisplayName(displayName) {
  const parts = (displayName ?? '').trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/** OAuth providers often omit isNewUser; treat very recent accounts as new. */
function isRecentlyCreatedFirebaseUser(user) {
  const created = user.metadata?.creationTime;
  if (!created) return false;
  const createdMs = Date.parse(created);
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs < 2 * 60 * 1000;
}

function resolveIsNewUser(result, user) {
  return getAdditionalUserInfo(result)?.isNewUser === true || isRecentlyCreatedFirebaseUser(user);
}

function mapFirebaseError(error) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Popup was blocked. Allow popups for this site or use redirect sign-in.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/redirect-cancelled-by-user': 'Sign-in was cancelled before it completed.',
    'auth/redirect-operation-pending': 'Sign-in is still in progress. Wait a moment and try again.',
    'auth/unauthorized-domain':
      'This site is not authorized for sign-in. Add app.clearform.in to Firebase Authorized domains.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for this app.',
    'auth/web-storage-unsupported':
      'Sign-in storage is blocked. Allow cookies for this site (Brave Shields / strict privacy).',
  };
  return map[error.code] ?? error.message ?? 'Authentication failed.';
}

/** When Microsoft redirect pending but getRedirectResult() is null after auth is ready. */
export function getMicrosoftRedirectNullErrorMessage() {
  return (
    'Microsoft sign-in did not finish (Firebase returned no redirect session). ' +
    'On Brave: lower Shields for login.microsoftonline.com and login.live.com, disable wallet extensions, or try Chrome incognito. ' +
    'Confirm app.clearform.in is in Firebase Authorized domains and Azure redirect URIs match Firebase.'
  );
}

/**
 * Redirect OAuth must start and finish on the same origin as VITE_FIREBASE_AUTH_DOMAIN.
 * If the user opened www or localhost while prod authDomain is app.clearform.in, hop first.
 */
export function resolveMicrosoftRedirectStartUrl(returnTo) {
  const authOrigin = getFirebaseAuthOrigin();
  if (!authOrigin || typeof window === 'undefined') return null;

  const current = window.location.origin;
  if (current === authOrigin) return null;

  const path = '/signin';
  const params = new URLSearchParams();
  params.set('provider', 'microsoft');
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    params.set('returnTo', returnTo);
  }
  return `${authOrigin}${path}?${params.toString()}`;
}

/**
 * Sync Firebase session with Nest API (user row + onboarding flag).
 */
export async function syncUserWithBackend() {
  if (!isApiConfigured()) {
    return { onboardingCompleted: false, user: null };
  }

  const run = async () => {
    try {
      const data = await fetchMeWithRetry();
      if (!data?.user) {
        throw new Error('Could not sync your account with the server. Please try again.');
      }
      const onboardingCompleted = data.user.onboardingCompleted === true;
      writeOnboardingHint(onboardingCompleted);
      return {
        onboardingCompleted,
        user: data.user,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('sync your account')) {
        throw error;
      }
      throw new Error(
        'Could not sync your account with the server. Check your connection and try again.',
      );
    }
  };

  if (!backendSyncPromise) {
    backendSyncPromise = runSingleFlightSync(run).finally(() => {
      backendSyncPromise = null;
    });
  }
  return backendSyncPromise;
}

function resolveOAuthMethod(result, user) {
  const providerId =
    result?.providerId ||
    user?.providerData?.[0]?.providerId ||
    '';
  if (providerId.includes('google')) return 'google';
  if (providerId.includes('microsoft')) return 'microsoft';
  if (providerId.includes('password')) return 'email';
  return 'oauth';
}

function captureAuthAnalytics(payload, firebaseUser, { isNewUser, method, trackAuth }) {
  identifyUser({
    id: payload?.user?.id,
    uid: firebaseUser?.uid,
    email: payload?.email ?? firebaseUser?.email,
    firstName: payload?.firstName,
    lastName: payload?.lastName,
  });
  if (!trackAuth) return;
  const email = payload?.email ?? firebaseUser?.email;
  if (isNewUser) trackSignup({ method, email });
  else trackSignIn({ method, email });
}

async function buildUserFromFirebaseUser(user, { isNewUser, method, trackAuth } = {}) {
  await storeToken(user);
  const { firstName, lastName } = parseDisplayName(user.displayName);
  const backend = await syncUserWithBackend();
  const payload = {
    email: user.email,
    firstName,
    lastName,
    isNewUser: isNewUser === true,
    ...backend,
  };
  captureAuthAnalytics(payload, user, {
    isNewUser: isNewUser === true,
    method: method ?? 'session',
    trackAuth: trackAuth === true,
  });
  return payload;
}

async function buildUserFromFirebaseResult(result) {
  const { user } = result;
  const isNewUser = resolveIsNewUser(result, user);
  return buildUserFromFirebaseUser(user, {
    isNewUser,
    method: resolveOAuthMethod(result, user),
    trackAuth: true,
  });
}

/**
 * When getRedirectResult is null but Firebase still has a session (redirect race / Brave).
 */
export async function restoreFirebaseSessionFromCurrentUser() {
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user?.email) return null;
  logAuthDebug('session-bridge', { uid: user.uid, email: user.email });
  return buildUserFromFirebaseUser(user, { isNewUser: isRecentlyCreatedFirebaseUser(user) });
}

/**
 * Microsoft on Mac/Brave: popup handler often stays blank — use full-page redirect.
 */
export async function startMicrosoftSignInRedirect(returnTo) {
  if (!auth || !microsoftProvider) return rejectLocalOAuth();
  const canonicalUrl = resolveMicrosoftRedirectStartUrl(returnTo);
  if (canonicalUrl) {
    logAuthDebug('microsoft-redirect-hop', { from: window.location.origin, to: canonicalUrl });
    window.location.assign(canonicalUrl);
    return;
  }

  try {
    if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
    } else {
      sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    }
    sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, 'microsoft');
    logAuthDebug('microsoft-redirect-start', { origin: window.location.origin });
    await signInWithRedirect(auth, microsoftProvider);
  } catch (error) {
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    logAuthWarn('microsoft-redirect-start-failed', { code: error?.code, message: error?.message });
    throw new Error(mapFirebaseError(error));
  }
}

/**
 * Optional fallback when redirect fails (popup often blank on Brave — user must opt in).
 */
export async function startMicrosoftSignInPopup() {
  if (!auth || !microsoftProvider) return rejectLocalOAuth();
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    logAuthDebug('microsoft-popup-start', { origin: window.location.origin });
    const result = await signInWithPopup(auth, microsoftProvider);
    return await buildUserFromFirebaseResult(result);
  } catch (error) {
    logAuthWarn('microsoft-popup-failed', { code: error?.code, message: error?.message });
    throw new Error(mapFirebaseError(error));
  }
}

/** Clears cached redirect consumption so Retry can call getRedirectResult again. */
export function resetRedirectSignInConsumption() {
  redirectResultPromise = null;
}

export function readAuthReturnTo() {
  const returnTo = sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return undefined;
}

async function consumeRedirectSignInResultInternal() {
  await waitForFirebaseAuthInit();
  await delay(REDIRECT_SETTLE_MS);

  let result = null;
  try {
    result = await getRedirectResult(auth);
  } catch (error) {
    logAuthWarn('getRedirectResult-error', { code: error?.code, message: error?.message });
    throw new Error(mapFirebaseError(error));
  }

  if (result?.user) {
    logAuthDebug('redirect-result-ok', { uid: result.user.uid, provider: result.providerId });
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    return buildUserFromFirebaseResult(result);
  }

  const pending = sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY);
  if (pending) {
    logAuthDebug('redirect-result-null', {
      pending,
      hasCurrentUser: Boolean(auth.currentUser?.email),
    });
    const bridged = await restoreFirebaseSessionFromCurrentUser();
    if (bridged) {
      sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
      return bridged;
    }
  }

  return null;
}

/**
 * Call once on app load after returning from Microsoft OAuth redirect.
 */
export async function consumeRedirectSignInResult() {
  if (!auth) return null;
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      try {
        return await consumeRedirectSignInResultInternal();
      } catch (error) {
        sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
        if (error instanceof Error) throw error;
        throw new Error(mapFirebaseError(error));
      }
    })();
  }
  return redirectResultPromise;
}

export async function signInWithEmail(email, password) {
  if (!auth) {
    const user = await localSignInWithEmail(email, password);
    const payload = { ...user, user: null };
    captureAuthAnalytics(payload, null, {
      isNewUser: false,
      method: 'email',
      trackAuth: true,
    });
    return payload;
  }
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await storeToken(user);
    const { firstName, lastName } = parseDisplayName(user.displayName);
    const backend = await syncUserWithBackend();
    const payload = { email: user.email, firstName, lastName, ...backend };
    captureAuthAnalytics(payload, user, {
      isNewUser: false,
      method: 'email',
      trackAuth: true,
    });
    return payload;
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function signUpWithEmail(email, password, firstName, lastName) {
  if (!auth) {
    const user = await localSignUpWithEmail(email, password, firstName, lastName);
    const payload = { ...user, user: null };
    captureAuthAnalytics(payload, null, {
      isNewUser: true,
      method: 'email',
      trackAuth: true,
    });
    return payload;
  }
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = [firstName, lastName].filter(Boolean).join(' ');
    if (displayName) await updateProfile(user, { displayName });
    await storeToken(user);
    const backend = await syncUserWithBackend();
    const payload = { email: user.email, firstName, lastName, ...backend };
    captureAuthAnalytics(payload, user, {
      isNewUser: true,
      method: 'email',
      trackAuth: true,
    });
    return payload;
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function signInWithGoogle(returnTo) {
  if (!auth || !googleProvider) return rejectLocalOAuth();
  try {
    if (isBraveBrowser()) {
      if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
      }
      sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, 'google');
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    const result = await signInWithPopup(auth, googleProvider);
    return await buildUserFromFirebaseResult(result);
  } catch (error) {
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error(mapFirebaseError(error));
    }
    throw new Error(mapFirebaseError(error));
  }
}

/** @deprecated Use startMicrosoftSignInRedirect — popup fails on Mac/Brave with Microsoft. */
export async function signInWithMicrosoft() {
  return startMicrosoftSignInRedirect();
}

export async function signOutUser() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  redirectResultPromise = null;
  backendSyncPromise = null;
  clearAuthClientContext();
  resetAuthBootstrapCoordinator();
  resetAnalytics();
  if (!auth) {
    clearLocalDevToken();
    return;
  }
  await signOut(auth);
}

export async function requestPasswordResetEmail(email) {
  if (!auth) {
    throw new Error('Password reset is unavailable in local frontend mode. Change password from Profile → Security after signing in.');
  }
  const trimmed = (email ?? '').trim();
  if (!trimmed) throw new Error('Enter your email address first.');
  try {
    await sendPasswordResetEmail(auth, trimmed);
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '@/config/firebase';
import { fetchMe } from '@/api/services/authMeService';
import { isApiConfigured } from '@/config/env';

const TOKEN_KEY = 'clearform:auth-token';
export const AUTH_RETURN_TO_KEY = 'clearform:auth-return-to';
export const AUTH_REDIRECT_PENDING_KEY = 'clearform:auth-redirect-pending';

let redirectResultPromise = null;

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
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
  };
  return map[error.code] ?? error.message ?? 'Authentication failed.';
}

/**
 * Sync Firebase session with Nest API (user row + onboarding flag).
 */
export async function syncUserWithBackend() {
  if (!isApiConfigured()) {
    return { onboardingCompleted: false, user: null };
  }
  try {
    const data = await fetchMe();
    if (!data?.user) {
      throw new Error('Could not sync your account with the server. Please try again.');
    }
    return {
      onboardingCompleted: data.user.onboardingCompleted === true,
      user: data.user,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('sync your account')) {
      throw error;
    }
    throw new Error('Could not sync your account with the server. Check your connection and try again.');
  }
}

async function buildUserFromFirebaseResult(result) {
  const { user } = result;
  await storeToken(user);
  const { firstName, lastName } = parseDisplayName(user.displayName);
  const isNewUser = resolveIsNewUser(result, user);
  const backend = await syncUserWithBackend();
  return { email: user.email, firstName, lastName, isNewUser, ...backend };
}

/**
 * Microsoft on Mac/Brave: popup handler often stays blank — use full-page redirect.
 */
export async function startMicrosoftSignInRedirect(returnTo) {
  try {
    if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
    } else {
      sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    }
    sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, 'microsoft');
    await signInWithRedirect(auth, microsoftProvider);
  } catch (error) {
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    throw new Error(mapFirebaseError(error));
  }
}

export function readAuthReturnTo() {
  const returnTo = sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return undefined;
}

/**
 * Call once on app load after returning from Microsoft OAuth redirect.
 */
export async function consumeRedirectSignInResult() {
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      try {
        const result = await getRedirectResult(auth);
        sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
        if (!result?.user) return null;
        return await buildUserFromFirebaseResult(result);
      } catch (error) {
        sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
        throw new Error(mapFirebaseError(error));
      }
    })();
  }
  return redirectResultPromise;
}

export async function signInWithEmail(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await storeToken(user);
    const { firstName, lastName } = parseDisplayName(user.displayName);
    const backend = await syncUserWithBackend();
    return { email: user.email, firstName, lastName, ...backend };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function signUpWithEmail(email, password, firstName, lastName) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = [firstName, lastName].filter(Boolean).join(' ');
    if (displayName) await updateProfile(user, { displayName });
    await storeToken(user);
    const backend = await syncUserWithBackend();
    return { email: user.email, firstName, lastName, ...backend };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await buildUserFromFirebaseResult(result);
  } catch (error) {
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
  await signOut(auth);
}

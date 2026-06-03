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
import { auth, googleProvider, microsoftProvider } from '@/config/firebase';
import { fetchMe } from '@/api/services/authMeService';
import { isApiConfigured } from '@/config/env';

const TOKEN_KEY = 'clearform:auth-token';
export const AUTH_RETURN_TO_KEY = 'clearform:auth-return-to';
export const AUTH_REDIRECT_PENDING_KEY = 'clearform:auth-redirect-pending';

let redirectResultPromise = null;

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
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/redirect-cancelled-by-user': 'Sign-in was cancelled before it completed.',
    'auth/redirect-operation-pending': 'Sign-in is still in progress. Wait a moment and try again.',
    'auth/unauthorized-domain':
      'This site is not authorized for sign-in. Add app.clearform.in to Firebase Authorized domains.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for this app.',
  };
  return map[error.code] ?? error.message ?? 'Authentication failed.';
}

/** When Microsoft redirect pending but getRedirectResult() is null after auth is ready. */
export function getMicrosoftRedirectNullErrorMessage() {
  return (
    'Microsoft sign-in did not finish (Firebase returned no redirect session). ' +
    'Try Chrome or allow third-party cookies for this site (Brave often blocks them). ' +
    'If it keeps failing, confirm app.clearform.in is in Firebase Authorized domains and Azure redirect URIs match Firebase.'
  );
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

async function buildUserFromFirebaseUser(user, { isNewUser } = {}) {
  await storeToken(user);
  const { firstName, lastName } = parseDisplayName(user.displayName);
  const backend = await syncUserWithBackend();
  return {
    email: user.email,
    firstName,
    lastName,
    isNewUser: isNewUser === true,
    ...backend,
  };
}

async function buildUserFromFirebaseResult(result) {
  const { user } = result;
  const isNewUser = resolveIsNewUser(result, user);
  return buildUserFromFirebaseUser(user, { isNewUser });
}

/**
 * When getRedirectResult is null but Firebase still has a session (redirect race / Brave).
 */
export async function restoreFirebaseSessionFromCurrentUser() {
  const user = auth.currentUser;
  if (!user?.email) return null;
  return buildUserFromFirebaseUser(user, { isNewUser: isRecentlyCreatedFirebaseUser(user) });
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

/**
 * Call once on app load after returning from Microsoft OAuth redirect.
 */
export async function consumeRedirectSignInResult() {
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      try {
        await waitForFirebaseAuthInit();
        const result = await getRedirectResult(auth);
        if (!result?.user) {
          const pending = sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY);
          if (pending) {
            const bridged = await restoreFirebaseSessionFromCurrentUser();
            if (bridged) {
              sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
              return bridged;
            }
          }
          return null;
        }
        const user = await buildUserFromFirebaseResult(result);
        sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
        return user;
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

export async function requestPasswordResetEmail(email) {
  const trimmed = (email ?? '').trim();
  if (!trimmed) throw new Error('Enter your email address first.');
  try {
    await sendPasswordResetEmail(auth, trimmed);
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

import { upsertUserAccount, getUserAccountByEmail } from '@/features/auth/utils/userAccountsStorage';
import { readOnboardingComplete } from '@/features/onboarding/utils/onboardingStorage';
import { getItem, setItem, removeKey } from '@/utils/localStorageSafe';
import * as sessionStorageSafe from '@/utils/sessionStorageSafe';

const TOKEN_KEY = 'clearform:auth-token';
const LOCAL_DEV_TOKEN = 'local-dev-session';

function storeLocalDevToken(email) {
  const val = `${LOCAL_DEV_TOKEN}:${email}`;
  setItem(TOKEN_KEY, val);
  sessionStorageSafe.setItem(TOKEN_KEY, val);
}

export function clearLocalDevToken() {
  removeKey(TOKEN_KEY);
  sessionStorageSafe.removeItem(TOKEN_KEY);
}

export function restoreLocalDevToken() {
  return getItem(TOKEN_KEY);
}

const oauthUnavailableMessage =
  'Social sign-in needs Supabase keys in .env. For local frontend work, use email sign-up or sign-in.';

export async function localSignInWithEmail(email, password) {
  const account = getUserAccountByEmail(email);
  if (!account) {
    throw new Error('No account found with this email.');
  }
  if (!account.password || account.password !== password) {
    throw new Error('Incorrect password.');
  }
  storeLocalDevToken(account.email);
  return {
    email: account.email,
    firstName: account.firstName ?? '',
    lastName: account.lastName ?? '',
    onboardingCompleted: readOnboardingComplete(),
  };
}

export async function localSignUpWithEmail(email, password, firstName, lastName) {
  const trimmedEmail = email?.trim();
  if (getUserAccountByEmail(trimmedEmail)) {
    throw new Error('An account with this email already exists.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  upsertUserAccount({
    email: trimmedEmail,
    firstName,
    lastName,
    password,
  });
  storeLocalDevToken(trimmedEmail);
  return {
    email: trimmedEmail,
    firstName: firstName?.trim() ?? '',
    lastName: lastName?.trim() ?? '',
    onboardingCompleted: false,
    isNewUser: true,
  };
}

export function rejectLocalOAuth() {
  throw new Error(oauthUnavailableMessage);
}

import { upsertUserAccount, getUserAccountByEmail } from '@/features/auth/utils/userAccountsStorage';
import { readOnboardingComplete } from '@/features/onboarding/utils/onboardingStorage';

const TOKEN_KEY = 'clearform:auth-token';
const LOCAL_DEV_TOKEN = 'local-dev-session';

function storeLocalDevToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, LOCAL_DEV_TOKEN);
  }
}

export function clearLocalDevToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

const oauthUnavailableMessage =
  'Google and Microsoft sign-in need Firebase keys in .env.local. For local frontend work, use email sign-up or sign-in.';

export async function localSignInWithEmail(email, password) {
  const account = getUserAccountByEmail(email);
  if (!account) {
    throw new Error('No account found with this email.');
  }
  if (!account.password || account.password !== password) {
    throw new Error('Incorrect password.');
  }
  storeLocalDevToken();
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
  storeLocalDevToken();
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

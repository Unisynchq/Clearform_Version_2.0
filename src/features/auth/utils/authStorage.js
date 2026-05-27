import { readJson, writeJson, removeKey } from '@/utils/localStorageSafe';

const AUTH_SESSION_KEY = 'clearform_auth_session';

export const readAuthSession = () =>
  readJson(AUTH_SESSION_KEY, null);

export const writeAuthSession = (session) => {
  writeJson(AUTH_SESSION_KEY, {
    isAuthenticated: true,
    email: session.email ?? '',
    firstName: session.firstName ?? '',
    lastName: session.lastName ?? '',
  });
};

export const clearAuthSession = () => {
  removeKey(AUTH_SESSION_KEY);
};

export const isAuthSessionValid = () => {
  const session = readAuthSession();
  return session?.isAuthenticated === true && Boolean(session.email);
};

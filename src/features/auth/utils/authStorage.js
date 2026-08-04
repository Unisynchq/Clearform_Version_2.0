/**
 * Legacy UI profile cache helpers.
 *
 * Auth source of truth is Supabase Auth (JWT via getSession) + backend /auth/me.
 * Do not treat these keys as proof of authentication.
 */

import { readJson, writeJson, removeKey } from '@/utils/localStorageSafe';

const AUTH_SESSION_KEY = 'clearform_auth_session';

/** @deprecated Prefer Supabase getSession + Redux; kept for cleanup of old keys. */
export const readAuthSession = () => readJson(AUTH_SESSION_KEY, null);

/** No-op write — avoids dual auth state in localStorage (CLE-46). */
export const writeAuthSession = (_session) => {
  // Intentionally empty: authenticated state lives in Redux + Supabase session.
};

export const clearAuthSession = () => {
  removeKey(AUTH_SESSION_KEY);
};

/** Always false so boot never trusts a cached localStorage "logged in" flag. */
export const isAuthSessionValid = () => false;

import { auth } from '@/config/firebase';

/**
 * Returns a fresh Firebase ID token for API calls (forces refresh when user exists).
 */
export async function getFreshAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    return typeof window !== 'undefined'
      ? sessionStorage.getItem('clearform:auth-token')
      : null;
  }
  const token = await user.getIdToken(true);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('clearform:auth-token', token);
  }
  return token;
}

import { supabase, isSupabaseConfigured } from '@/config/supabase';
import { isAuthLogoutInProgress } from '@/features/auth/utils/authBootstrapCoordinator';

/**
 * Returns the current app access token from Supabase Auth.
 */
export async function getFreshAuthToken(forceRefresh = false) {
  if (!isSupabaseConfigured() || !supabase || typeof window === 'undefined' || isAuthLogoutInProgress()) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) return null;

  return data.session.access_token;
}

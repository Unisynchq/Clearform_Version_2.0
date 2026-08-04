import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginSuccess } from '@/store/slices/authSlice';
import { supabase } from '@/config/supabase';
import {
  AUTH_REDIRECT_PENDING_KEY,
  AUTH_RETURN_TO_KEY,
  restoreSession,
} from '@/features/auth/services/supabaseAuthService';
import {
  applyBackendOnboardingState,
  completeAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import * as sessionStorageSafe from '@/utils/sessionStorageSafe';
import { useToast } from '@/hooks/useToast';

function readOAuthError(searchParams) {
  const hashParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
      : null;

  const error = searchParams.get('error') || hashParams?.get('error');
  if (!error) return null;

  const description =
    searchParams.get('error_description') || hashParams?.get('error_description');

  return {
    error,
    description: description ? decodeURIComponent(description.replace(/\+/g, ' ')) : null,
  };
}

/**
 * CLE-46 best practice:
 * 1) Exchange OAuth code with Supabase Auth (source of truth for the JWT)
 * 2) Sync profile via backend GET /auth/me (Bearer token)
 * 3) Hydrate Redux in-memory and client-navigate — no localStorage auth handoff
 */
async function waitForSupabaseSession({ timeoutMs = 15000 } = {}) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const code = new URLSearchParams(window.location.search).get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session?.user?.email) {
      return data.session;
    }
  }

  const existing = await supabase.auth.getSession();
  if (existing.data?.session?.user?.email) {
    return existing.data.session;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription?.unsubscribe?.();
      reject(new Error('Sign-in session was not established in time.'));
    }, timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        clearTimeout(timeout);
        subscription?.unsubscribe?.();
        resolve(session);
      }
    });
  });
}

const SupabaseOAuthCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState('Finishing sign-in…');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fail = (message) => {
      sessionStorageSafe.removeItem(AUTH_REDIRECT_PENDING_KEY);
      setError(message);
      setTimeout(() => {
        if (!cancelled) {
          navigate(`/signin?oauth_error=${encodeURIComponent(message)}`, { replace: true });
        }
      }, 800);
    };

    const oauthError = readOAuthError(searchParams);
    if (oauthError) {
      fail(
        oauthError.description ||
          'Sign-in failed. Please try again or use email sign-in.',
      );
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      try {
        await waitForSupabaseSession();
        if (cancelled) return;

        setStatus('Syncing your account…');
        const user = await restoreSession();
        if (!user?.email) {
          throw new Error('Could not load your Clearform account after sign-in.');
        }

        const returnTo = sessionStorageSafe.getItem(AUTH_RETURN_TO_KEY);
        const nextParam = searchParams.get('next');
        const preferredReturnTo =
          (typeof returnTo === 'string' &&
            returnTo.startsWith('/') &&
            !returnTo.startsWith('//') &&
            returnTo) ||
          (typeof nextParam === 'string' && nextParam.startsWith('/') && nextParam) ||
          undefined;

        sessionStorageSafe.removeItem(AUTH_RETURN_TO_KEY);
        sessionStorageSafe.removeItem(AUTH_REDIRECT_PENDING_KEY);

        applyBackendOnboardingState(dispatch, user.onboardingCompleted);
        const path = await completeAuthNavigationAfterSync(dispatch, {
          onboardingCompleted: user.onboardingCompleted,
          isNewUser: user.isNewUser,
          returnTo: preferredReturnTo,
          showToast,
        });

        if (cancelled) return;

        dispatch(
          loginSuccess({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }),
        );

        setStatus('Signed in — opening Clearform…');
        showToast({
          type: 'success',
          message: 'Signed in successfully',
          duration: 3000,
        });
        navigate(path, { replace: true });
      } catch (err) {
        if (!cancelled) {
          fail(err?.message ?? 'Could not finish sign-in.');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, searchParams, showToast]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 text-center">
        <h2 className="text-[18px] font-semibold text-[#0f0f0e]">Sign-in failed</h2>
        <p className="mt-2 max-w-md text-[14px] text-[#6b6860]">{error}</p>
        <p className="mt-4 text-[13px] text-[#9e9b96]">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#18181b]" />
      <p className="text-[14px] text-[#6b6860]">{status}</p>
    </div>
  );
};

export default SupabaseOAuthCallback;

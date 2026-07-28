import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSubmitting, setError, loginSuccess, setAuthInitialized } from '@/store/slices/authSlice';
import {
  applyBackendOnboardingState,
  completeAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import {
  consumeRedirectSignInResult,
  readAuthReturnTo,
  AUTH_REDIRECT_PENDING_KEY,
  getMicrosoftRedirectNullErrorMessage,
  resetRedirectSignInConsumption,
  restoreSession,
} from '@/features/auth/services/supabaseAuthService';
import { useToast } from '@/hooks/useToast';
import {
  beginRedirectHandlerNavigation,
  endRedirectHandlerNavigation,
  canAttemptAuthRestore,
  isAuthLogoutInProgress,
  runSingleFlightAuthRestore,
} from '@/features/auth/utils/authBootstrapCoordinator';

/**
 * Completes Supabase provider redirects after the browser returns to /signin.
 */
const AuthRedirectHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const startedRef = useRef(false);
  const [syncError, setSyncError] = useState(null);

  const completeSignIn = async (user) => {
    const returnTo = readAuthReturnTo();
    applyBackendOnboardingState(dispatch, user.onboardingCompleted);
    const path = await completeAuthNavigationAfterSync(dispatch, {
      onboardingCompleted: user.onboardingCompleted,
      isNewUser: user.isNewUser,
      returnTo,
      showToast,
    });
    dispatch(
      loginSuccess({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
    );
    showToast({
      type: 'success',
      message: 'Signed in successfully',
      duration: 3000,
    });
    navigate(path, { replace: true });
  };

  const runRedirectFlow = async () => {
    if (isAuthLogoutInProgress() || !canAttemptAuthRestore()) {
      dispatch(setAuthInitialized(true));
      return;
    }
    const pending = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) : null;
    if (pending) dispatch(setSubmitting(true));
    setSyncError(null);

    beginRedirectHandlerNavigation();
    try {
      await runSingleFlightAuthRestore(async () => {
        const hasOAuthCallback =
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).has('code');

        if (pending && !hasOAuthCallback) {
          dispatch(setAuthInitialized(true));
          return;
        }

        let user = await consumeRedirectSignInResult();

        if (!user && (pending === 'microsoft' || pending === 'google')) {
          user = await restoreSession();
          if (user) {
            resetRedirectSignInConsumption();
          }
        }

        if (!user) {
          if (pending === 'microsoft' || pending === 'google') {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
            }
            dispatch(
              setError(
                pending === 'google'
                  ? 'Google sign-in did not finish. Try again or use email sign-in.'
                  : getMicrosoftRedirectNullErrorMessage(),
              ),
            );
          } else if (pending) {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
            }
            dispatch(
              setError(
                'Sign-in could not be completed. Close this tab and try again from the sign-in page.',
              ),
            );
          }
          dispatch(setAuthInitialized(true));
          return;
        }

        await completeSignIn(user);
      });
    } catch (err) {
      const message =
        err?.message || 'Could not sync your account with Clearform. Please try again.';
      dispatch(setError(message));
      setSyncError(message);
    } finally {
      dispatch(setSubmitting(false));
      dispatch(setAuthInitialized(true));
      endRedirectHandlerNavigation();
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runRedirectFlow();
  }, [dispatch, navigate, showToast]);

  if (!syncError) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[200] max-w-md -translate-x-1/2 rounded-lg border border-red-200 bg-white px-4 py-3 shadow-lg"
      role="alert"
    >
      <p className="text-[13px] text-red-700">{syncError}</p>
      <button
        type="button"
        onClick={() => {
          setSyncError(null);
          dispatch(setError(null));
          resetRedirectSignInConsumption();
          runRedirectFlow();
        }}
        className="mt-2 text-[12px] font-medium text-[#18181b] underline cursor-pointer"
      >
        Retry sign-in
      </button>
    </div>
  );
};

export default AuthRedirectHandler;

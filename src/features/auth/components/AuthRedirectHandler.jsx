import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSubmitting, setError, loginSuccess } from '@/store/slices/authSlice';
import {
  applyBackendOnboardingState,
  resolveAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import { auth } from '@/config/firebase';
import {
  consumeRedirectSignInResult,
  readAuthReturnTo,
  AUTH_REDIRECT_PENDING_KEY,
  getMicrosoftRedirectNullErrorMessage,
  resetRedirectSignInConsumption,
} from '@/features/auth/services/firebaseAuthService';
import { useToast } from '@/hooks/useToast';

/**
 * Completes Microsoft (and other) signInWithRedirect flows after the browser returns.
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
    const path = resolveAuthNavigationAfterSync(dispatch, {
      onboardingCompleted: user.onboardingCompleted,
      returnTo,
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
    const pending = sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY);
    if (pending) dispatch(setSubmitting(true));
    setSyncError(null);

    try {
      const user = await consumeRedirectSignInResult();
      if (!user) {
        if (pending === 'microsoft') {
          if (!auth.currentUser) {
            return;
          }
          sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
          dispatch(setError(getMicrosoftRedirectNullErrorMessage()));
        } else if (pending) {
          sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
          dispatch(
            setError(
              'Sign-in could not be completed. Close this tab and try again from the sign-in page.',
            ),
          );
        }
        return;
      }
      await completeSignIn(user);
    } catch (err) {
      const message =
        err?.message || 'Could not sync your account with Clearform. Please try again.';
      dispatch(setError(message));
      setSyncError(message);
    } finally {
      dispatch(setSubmitting(false));
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

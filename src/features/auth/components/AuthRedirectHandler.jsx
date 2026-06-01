import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSubmitting, setError, loginSuccess } from '@/store/slices/authSlice';
import {
  applyBackendOnboardingState,
  resolveAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import {
  consumeRedirectSignInResult,
  readAuthReturnTo,
  AUTH_REDIRECT_PENDING_KEY,
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

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const pending = sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY);

    (async () => {
      if (pending) dispatch(setSubmitting(true));
      try {
        const user = await consumeRedirectSignInResult();
        if (cancelled || !user) return;

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
          message: 'Signed in with Microsoft',
          duration: 3000,
        });
        navigate(path, { replace: true });
      } catch (err) {
        if (!cancelled) dispatch(setError(err.message));
      } finally {
        if (!cancelled) dispatch(setSubmitting(false));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, showToast]);

  return null;
};

export default AuthRedirectHandler;

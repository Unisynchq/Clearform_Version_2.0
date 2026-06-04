import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { loginSuccess } from '@/store/slices/authSlice';
import {
  applyBackendOnboardingState,
  resolveAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import {
  restoreFirebaseSessionFromCurrentUser,
  readAuthReturnTo,
  AUTH_REDIRECT_PENDING_KEY,
} from '@/features/auth/services/firebaseAuthService';
import { shouldSessionBridgeNavigate } from '@/features/auth/utils/authBootstrapCoordinator';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

/**
 * Hydrates Redux when Firebase has a session but local auth session was not written
 * (e.g. Microsoft redirect race or page refresh with valid Firebase user).
 */
const FirebaseSessionBridge = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const syncingRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser?.email || isAuthenticated || syncingRef.current) return;

      const pending = sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY);
      if (
        !shouldSessionBridgeNavigate({
          pendingMicrosoft: pending === 'microsoft' || pending === 'google',
          pathname: location.pathname,
        })
      ) {
        return;
      }

      syncingRef.current = true;
      try {
        const user = await restoreFirebaseSessionFromCurrentUser();
        if (!user?.email) return;

        const oauthPending = pending === 'microsoft' || pending === 'google';
        const returnTo = oauthPending ? readAuthReturnTo() : undefined;
        if (oauthPending) {
          sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
        }

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

        const guestPaths = ['/', '/signin', '/signup'];
        if (oauthPending || guestPaths.includes(location.pathname)) {
          if (oauthPending) {
            showToast({
              type: 'success',
              message: 'Signed in successfully',
              duration: 3000,
            });
          }
          navigate(path, { replace: true });
        }
      } catch {
        // AuthRedirectHandler surfaces redirect-flow errors when pending
      } finally {
        syncingRef.current = false;
      }
    });
    return () => unsub();
  }, [dispatch, navigate, location.pathname, isAuthenticated, showToast]);

  return null;
};

export default FirebaseSessionBridge;

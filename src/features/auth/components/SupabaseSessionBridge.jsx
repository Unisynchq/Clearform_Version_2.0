import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, setAuthInitialized } from '@/store/slices/authSlice';
import {
  applyBackendOnboardingState,
  completeAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import {
  restoreSession,
  readAuthReturnTo,
  AUTH_REDIRECT_PENDING_KEY,
} from '@/features/auth/services/supabaseAuthService';
import { supabase } from '@/config/supabase';
import {
  canAttemptAuthRestore,
  isAuthLogoutInProgress,
  runSingleFlightAuthRestore,
  shouldSessionBridgeNavigate,
} from '@/features/auth/utils/authBootstrapCoordinator';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';

/**
 * Hydrates Redux when a Supabase session exists but the app state has not yet
 * been restored (for example after a refresh or a provider redirect race).
 */
const SupabaseSessionBridge = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  useCrossTabSync();
  const isInitialized = useSelector((s) => s.auth.isInitialized);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const syncingRef = useRef(false);

  const hydrate = async ({ fromMessage = false } = {}) => {
    if (syncingRef.current || isAuthLogoutInProgress()) return;
    if (isInitialized && !fromMessage) return;

    if (!fromMessage && !canAttemptAuthRestore()) {
       if (!isInitialized) dispatch(setAuthInitialized(true));
       return;
    }

    const pending = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) : null;
    if (
      !fromMessage &&
      !shouldSessionBridgeNavigate({
        pendingMicrosoft: pending === 'microsoft' || pending === 'google',
        pathname: location.pathname,
      })
    ) {
      return;
    }

    syncingRef.current = true;
    try {
      await runSingleFlightAuthRestore(async () => {
        const user = await restoreSession();
        if (!user?.email) {
          if (!isInitialized) dispatch(setAuthInitialized(true));
          return;
        }

        const oauthPending = pending === 'microsoft' || pending === 'google';
        const returnTo = oauthPending ? readAuthReturnTo() : undefined;
        if (oauthPending && typeof window !== 'undefined') {
          sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
        }

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
      });
    } catch {
      // AuthRedirectHandler surfaces redirect-flow errors when pending
      if (!isInitialized) dispatch(setAuthInitialized(true));
    } finally {
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      void hydrate();
    }

    const handleMessage = (event) => {
      if (event?.origin !== window.location.origin) return;
      if (event?.data?.type !== 'clearform:supabase-oauth-complete') return;
      if (isAuthLogoutInProgress()) return;
      void hydrate({ fromMessage: true });
    };

    window.addEventListener('message', handleMessage);

    const {
      data: { subscription },
    } = supabase?.auth?.onAuthStateChange?.((_event, session) => {
      if (isAuthLogoutInProgress() || !session?.user?.email || isAuthenticated) return;
      void hydrate({ fromMessage: true });
    }) ?? { data: { subscription: null } };

    return () => {
      window.removeEventListener('message', handleMessage);
      subscription?.unsubscribe?.();
    };
  }, [dispatch, navigate, location.pathname, isAuthenticated, showToast]);

  return null;
};

export default SupabaseSessionBridge;

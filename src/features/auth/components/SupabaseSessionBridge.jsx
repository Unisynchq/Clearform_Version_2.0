import { useEffect, useRef, useCallback } from 'react';
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
import * as sessionStorageSafe from '@/utils/sessionStorageSafe';
import { supabase } from '@/config/supabase';
import {
  isAuthLogoutInProgress,
  runSingleFlightAuthRestore,
  shouldSessionBridgeNavigate,
} from '@/features/auth/utils/authBootstrapCoordinator';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';

/**
 * Sole cold-boot owner: restores Supabase session into Redux after refresh.
 * Does not toast or navigate on silent hydrate (dashboard reload).
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

  const isAuthenticatedRef = useRef(isAuthenticated);
  const isInitializedRef = useRef(isInitialized);
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  const showToastRef = useRef(showToast);
  const hasShownLoginToastRef = useRef(false);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);
  useEffect(() => {
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    if (!isAuthenticated) {
      hasShownLoginToastRef.current = false;
    }
  }, [isAuthenticated]);

  const hydrate = useCallback(
    async ({ fromMessage = false, celebrate = false } = {}) => {
      if (syncingRef.current || isAuthLogoutInProgress()) return;

      if (isAuthenticatedRef.current && !fromMessage) return;
      if (isInitializedRef.current && !fromMessage) return;

      const pending = sessionStorageSafe.getItem(AUTH_REDIRECT_PENDING_KEY);
      if (
        !fromMessage &&
        !shouldSessionBridgeNavigate({
          pendingMicrosoft: pending === 'microsoft' || pending === 'google',
          pathname: locationRef.current.pathname,
        })
      ) {
        return;
      }

      if (fromMessage && isAuthenticatedRef.current) return;

      syncingRef.current = true;
      try {
        await runSingleFlightAuthRestore(async () => {
          const user = await restoreSession();
          if (!user?.email) {
            if (!isInitializedRef.current) dispatch(setAuthInitialized(true));
            return;
          }

          const oauthPending = pending === 'microsoft' || pending === 'google';
          const returnTo = oauthPending ? readAuthReturnTo() : undefined;
          if (oauthPending) {
            sessionStorageSafe.removeItem(AUTH_REDIRECT_PENDING_KEY);
          }

          applyBackendOnboardingState(dispatch, user.onboardingCompleted);
          const path = await completeAuthNavigationAfterSync(dispatch, {
            onboardingCompleted: user.onboardingCompleted,
            isNewUser: user.isNewUser,
            returnTo,
            showToast: showToastRef.current,
          });
          dispatch(
            loginSuccess({
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }),
          );

          const guestPaths = ['/', '/signin', '/signup', '/auth/callback'];
          const onGuestPath = guestPaths.includes(locationRef.current.pathname);
          const shouldNavigate = oauthPending || onGuestPath || fromMessage;
          const shouldToast = (oauthPending || celebrate) && !hasShownLoginToastRef.current;

          if (shouldToast) {
            hasShownLoginToastRef.current = true;
            showToastRef.current({
              type: 'success',
              message: 'Signed in successfully',
              duration: 3000,
            });
          }

          if (shouldNavigate) {
            navigateRef.current(path, { replace: true });
          }
        });
      } catch {
        if (!isInitializedRef.current) dispatch(setAuthInitialized(true));
      } finally {
        syncingRef.current = false;
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!isInitializedRef.current) {
      void hydrate();
    }

    const handleMessage = (event) => {
      if (event?.origin !== window.location.origin) return;
      if (event?.data?.type !== 'clearform:supabase-oauth-complete') return;
      if (isAuthLogoutInProgress()) return;
      void hydrate({ fromMessage: true, celebrate: true });
    };

    window.addEventListener('message', handleMessage);

    const {
      data: { subscription },
    } =
      supabase?.auth?.onAuthStateChange?.((event, session) => {
        if (isAuthLogoutInProgress() || !session?.user?.email || isAuthenticatedRef.current) {
          return;
        }
        // INITIAL_SESSION is covered by the cold hydrate() call — avoid toast/nav races.
        if (event === 'INITIAL_SESSION') return;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          void hydrate({ fromMessage: false, celebrate: false });
        }
      }) ?? { data: { subscription: null } };

    return () => {
      window.removeEventListener('message', handleMessage);
      subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, hydrate]);

  return null;
};

export default SupabaseSessionBridge;

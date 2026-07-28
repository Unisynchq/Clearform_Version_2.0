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
 *
 * IMPORTANT: The useEffect subscribes to onAuthStateChange exactly ONCE.
 * Mutable values (isAuthenticated, location, navigate, showToast) are accessed
 * through refs so that the subscription closure always reads the latest values
 * without triggering effect re-runs (which caused the infinite toast loop).
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

  // Refs to break the dependency cycle — the onAuthStateChange callback
  // must see the latest values without re-subscribing on every state change.
  const isAuthenticatedRef = useRef(isAuthenticated);
  const isInitializedRef = useRef(isInitialized);
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  const showToastRef = useRef(showToast);
  const hasShownLoginToastRef = useRef(false);

  // Keep refs in sync with latest values
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
  useEffect(() => { isInitializedRef.current = isInitialized; }, [isInitialized]);
  useEffect(() => { locationRef.current = location; }, [location]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  // Reset the toast guard when the user logs out so the next login shows it
  useEffect(() => {
    if (!isAuthenticated) {
      hasShownLoginToastRef.current = false;
    }
  }, [isAuthenticated]);

  const hydrate = useCallback(async ({ fromMessage = false } = {}) => {
    if (syncingRef.current || isAuthLogoutInProgress()) return;

    // If already authenticated and this is NOT a message-triggered call, skip
    if (isAuthenticatedRef.current && !fromMessage) return;
    if (isInitializedRef.current && !fromMessage) return;

    if (!fromMessage && !canAttemptAuthRestore()) {
       if (!isInitializedRef.current) dispatch(setAuthInitialized(true));
       return;
    }

    const pending = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) : null;
    if (
      !fromMessage &&
      !shouldSessionBridgeNavigate({
        pendingMicrosoft: pending === 'microsoft' || pending === 'google',
        pathname: locationRef.current.pathname,
      })
    ) {
      return;
    }

    // If already authenticated and we get a fromMessage call, don't re-hydrate
    // (the session is already established, no need to show duplicate toasts)
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
        if (oauthPending && typeof window !== 'undefined') {
          sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
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

        const guestPaths = ['/', '/signin', '/signup'];
        if (oauthPending || guestPaths.includes(locationRef.current.pathname)) {
          // Show the "Signed in" toast at most once per login session
          if (oauthPending && !hasShownLoginToastRef.current) {
            hasShownLoginToastRef.current = true;
            showToastRef.current({
              type: 'success',
              message: 'Signed in successfully',
              duration: 3000,
            });
          }
          navigateRef.current(path, { replace: true });
        }
      });
    } catch {
      // AuthRedirectHandler surfaces redirect-flow errors when pending
      if (!isInitializedRef.current) dispatch(setAuthInitialized(true));
    } finally {
      syncingRef.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isInitializedRef.current) {
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
      // Use the ref (not the stale closure value) to check current auth state
      if (isAuthLogoutInProgress() || !session?.user?.email || isAuthenticatedRef.current) return;
      void hydrate({ fromMessage: true });
    }) ?? { data: { subscription: null } };

    return () => {
      window.removeEventListener('message', handleMessage);
      subscription?.unsubscribe?.();
    };
    // dispatch and hydrate are stable (useCallback with [dispatch] dep).
    // This effect must run exactly ONCE to set up the onAuthStateChange listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, hydrate]);

  return null;
};

export default SupabaseSessionBridge;

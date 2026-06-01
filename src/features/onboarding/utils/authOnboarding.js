import {
  startOnboarding,
  dismissOnboardingSession,
  completeOnboarding,
} from '@/store/slices/onboardingSlice';
import { resetFormsForOnboarding } from '@/store/slices/formsSlice';

/** Sign-in: dashboard by default; honors deep-link return path from RequireAuth. */
export const resolveSignInNavigation = (dispatch, { returnTo } = {}) => {
  dispatch(dismissOnboardingSession());
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return '/dashboard';
};

/** Sign-up: always start first-time template onboarding (not used on sign-in). */
export const resolveSignupNavigation = (dispatch) => {
  dispatch(startOnboarding());
  dispatch(resetFormsForOnboarding());
  return '/onboarding';
};

/** Apply server onboarding state before route decision. */
export const applyBackendOnboardingState = (dispatch, onboardingCompleted) => {
  if (onboardingCompleted) {
    dispatch(completeOnboarding());
  }
};

/**
 * After Firebase + GET /auth/me — server onboardingCompleted is source of truth.
 * Microsoft OAuth often reports isNewUser=false; do not use it for routing.
 */
export const resolveAuthNavigationAfterSync = (
  dispatch,
  { onboardingCompleted = false, returnTo } = {},
) => {
  if (onboardingCompleted) {
    return resolveSignInNavigation(dispatch, { returnTo });
  }
  return resolveSignupNavigation(dispatch);
};

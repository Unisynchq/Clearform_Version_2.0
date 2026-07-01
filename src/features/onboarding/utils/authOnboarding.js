import {
  startOnboarding,
  dismissOnboardingSession,
  completeOnboarding,
} from '@/store/slices/onboardingSlice';
import { resetFormsForOnboarding } from '@/store/slices/formsSlice';
import { claimPendingPurchaseIfPresent } from '@/features/billing/utils/claimPendingPurchase';

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
 * Link a Razorpay payment from the landing redirect after auth sync.
 * Failures are non-blocking — signup/sign-in still completes.
 */
export async function claimPendingPurchaseIfNeeded({ showToast } = {}) {
  return claimPendingPurchaseIfPresent({ showToast });
}

/**
 * After Firebase + GET /auth/me — server onboardingCompleted is source of truth.
 * Microsoft OAuth often reports isNewUser=false; do not use it for routing.
 * returnTo is only honoured for existing users — new users always go to /onboarding.
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

/**
 * Claim pending payment (if any), then resolve post-auth navigation.
 */
export async function completeAuthNavigationAfterSync(
  dispatch,
  { onboardingCompleted = false, returnTo, showToast } = {},
) {
  await claimPendingPurchaseIfNeeded({ showToast });
  return resolveAuthNavigationAfterSync(dispatch, { onboardingCompleted, returnTo });
}

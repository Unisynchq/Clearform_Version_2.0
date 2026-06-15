import {
  startOnboarding,
  dismissOnboardingSession,
  completeOnboarding,
} from '@/store/slices/onboardingSlice';
import { resetFormsForOnboarding } from '@/store/slices/formsSlice';
import { claimPurchase } from '@/api/services/billingService';
import { isApiConfigured } from '@/config/env';
import {
  clearPendingPaymentId,
  getPendingPaymentId,
} from '@/features/billing/utils/pendingPaymentStorage';

const BILLING_CLAIM_SUPPORT = 'support@clearform.in';

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
  const paymentId = getPendingPaymentId();
  if (!paymentId || !isApiConfigured()) {
    return { claimed: false };
  }

  try {
    await claimPurchase({ paymentId });
    clearPendingPaymentId();
    showToast?.({
      type: 'success',
      message: 'Your pilot payment is linked to this account.',
      duration: 4000,
    });
    return { claimed: true };
  } catch (err) {
    const message =
      err?.message ??
      `We could not link your payment. Email ${BILLING_CLAIM_SUPPORT} with your payment ID.`;
    showToast?.({
      type: 'error',
      message,
      duration: 8000,
    });
    return { claimed: false, error: message };
  }
}

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

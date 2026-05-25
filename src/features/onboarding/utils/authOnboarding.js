import { startOnboarding, dismissOnboardingSession } from '@/store/slices/onboardingSlice';
import { resetFormsForOnboarding } from '@/store/slices/formsSlice';

/** Already signed-in users always land on the dashboard (onboarding is signup-only). */
export const getPostAuthPath = () => '/dashboard';

/** Sign-in: always dashboard; never start onboarding (first-time flow is signup only). */
export const resolveSignInNavigation = (dispatch) => {
  dispatch(dismissOnboardingSession());
  return '/dashboard';
};

/** Sign-up: always start first-time template onboarding (not used on sign-in). */
export const resolveSignupNavigation = (dispatch) => {
  dispatch(startOnboarding());
  dispatch(resetFormsForOnboarding());
  return '/onboarding';
};

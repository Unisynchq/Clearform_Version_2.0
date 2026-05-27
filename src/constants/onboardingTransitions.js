import { premiumTransition } from './premiumTransition';

export const ONBOARDING_WELCOME_PATH = '/onboarding';
export const ONBOARDING_TEMPLATES_PATH = '/onboarding/templates';

/** +1 forward (welcome → templates), -1 back, 0 fade */
export function getOnboardingSlideDirection(fromPath, toPath) {
  if (fromPath === ONBOARDING_WELCOME_PATH && toPath === ONBOARDING_TEMPLATES_PATH) {
    return 1;
  }
  if (fromPath === ONBOARDING_TEMPLATES_PATH && toPath === ONBOARDING_WELCOME_PATH) {
    return -1;
  }
  return 0;
}

export const onboardingPageTransition = premiumTransition;

export const onboardingPageVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 40 : direction < 0 ? -40 : 0,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -32 : direction < 0 ? 32 : 0,
  }),
};

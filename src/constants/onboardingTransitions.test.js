import { describe, it, expect } from 'vitest';
import {
  getOnboardingSlideDirection,
  ONBOARDING_TEMPLATES_PATH,
  ONBOARDING_WELCOME_PATH,
} from './onboardingTransitions';

describe('onboardingTransitions', () => {
  it('slides forward from welcome to templates', () => {
    expect(
      getOnboardingSlideDirection(ONBOARDING_WELCOME_PATH, ONBOARDING_TEMPLATES_PATH),
    ).toBe(1);
  });

  it('slides back from templates to welcome', () => {
    expect(
      getOnboardingSlideDirection(ONBOARDING_TEMPLATES_PATH, ONBOARDING_WELCOME_PATH),
    ).toBe(-1);
  });

  it('uses neutral fade for same route', () => {
    expect(
      getOnboardingSlideDirection(ONBOARDING_WELCOME_PATH, ONBOARDING_WELCOME_PATH),
    ).toBe(0);
  });
});

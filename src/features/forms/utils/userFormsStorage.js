import { readJson, writeJson, removeKey } from '@/utils/localStorageSafe';
import { readOnboardingComplete, readOnboardingSession } from '@/features/onboarding/utils/onboardingStorage';

const USER_FORMS_KEY = 'clearform_user_forms';

export const readUserForms = () => {
  const parsed = readJson(USER_FORMS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
};

export const writeUserForms = (forms) => {
  writeJson(USER_FORMS_KEY, forms);
};

export const clearUserForms = () => {
  removeKey(USER_FORMS_KEY);
};

/** Load saved forms when onboarding is done or an in-progress onboarding session exists. */
export const readPersistedForms = () => {
  if (readOnboardingComplete()) return readUserForms();
  const session = readOnboardingSession();
  if (session.active) return readUserForms();
  return [];
};

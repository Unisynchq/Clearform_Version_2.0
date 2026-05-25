import { clearAuthSession } from '@/features/auth/utils/authStorage';
import { clearUserForms } from '@/features/forms/utils/userFormsStorage';
import { clearWorkspaces } from '@/features/forms/utils/workspacesStorage';
import { clearFormsUi } from '@/features/forms/utils/formsUiStorage';
import { writeOnboardingComplete, writeOnboardingSession } from '@/features/onboarding/utils/onboardingStorage';
import { removeKey } from '@/utils/localStorageSafe';

/** Remove all Clearform localStorage keys (auth, forms, workspaces, onboarding, builder drafts). */
export const clearAllAppStorage = () => {
  clearAuthSession();
  clearUserForms();
  clearWorkspaces();
  clearFormsUi();
  writeOnboardingComplete(false);
  writeOnboardingSession({ active: false, step: 1, selectedTemplateId: null });

  if (typeof window === 'undefined') return;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith('clearform_')) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => removeKey(key));
};

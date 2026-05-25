const COMPLETE_KEY = 'clearform_onboarding_complete';
const ACTIVE_KEY = 'clearform_onboarding_active';
const STEP_KEY = 'clearform_onboarding_step';
const TEMPLATE_KEY = 'clearform_onboarding_template_id';

export const readOnboardingComplete = () =>
  typeof window !== 'undefined' && localStorage.getItem(COMPLETE_KEY) === 'true';

export const writeOnboardingComplete = (value) => {
  if (typeof window === 'undefined') return;
  if (value) localStorage.setItem(COMPLETE_KEY, 'true');
  else localStorage.removeItem(COMPLETE_KEY);
};

export const readOnboardingSession = () => {
  if (typeof window === 'undefined') {
    return { active: false, step: 1, selectedTemplateId: null };
  }
  return {
    active: localStorage.getItem(ACTIVE_KEY) === 'true',
    step: Number(localStorage.getItem(STEP_KEY) || '1'),
    selectedTemplateId: localStorage.getItem(TEMPLATE_KEY) || null,
  };
};

export const writeOnboardingSession = ({ active, step, selectedTemplateId }) => {
  if (typeof window === 'undefined') return;
  if (active) {
    localStorage.setItem(ACTIVE_KEY, 'true');
    localStorage.setItem(STEP_KEY, String(step));
    if (selectedTemplateId) localStorage.setItem(TEMPLATE_KEY, selectedTemplateId);
    else localStorage.removeItem(TEMPLATE_KEY);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(STEP_KEY);
    localStorage.removeItem(TEMPLATE_KEY);
  }
};

export const clearOnboardingSession = () => {
  writeOnboardingComplete(true);
  writeOnboardingSession({ active: false, step: 1, selectedTemplateId: null });
};

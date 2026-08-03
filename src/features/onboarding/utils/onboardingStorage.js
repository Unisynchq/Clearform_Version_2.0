import { getItem, setItem, removeKey } from '@/utils/localStorageSafe';

const COMPLETE_KEY = 'clearform_onboarding_complete';
const ACTIVE_KEY = 'clearform_onboarding_active';
const STEP_KEY = 'clearform_onboarding_step';
const TEMPLATE_KEY = 'clearform_onboarding_template_id';

export const readOnboardingComplete = () => getItem(COMPLETE_KEY) === 'true';

export const writeOnboardingComplete = (value) => {
  if (value) setItem(COMPLETE_KEY, 'true');
  else removeKey(COMPLETE_KEY);
};

export const readOnboardingSession = () => {
  return {
    active: getItem(ACTIVE_KEY) === 'true',
    step: Number(getItem(STEP_KEY) ?? '0'),
    selectedTemplateId: getItem(TEMPLATE_KEY) || null,
  };
};

export const writeOnboardingSession = ({ active, step, selectedTemplateId }) => {
  if (active) {
    setItem(ACTIVE_KEY, 'true');
    setItem(STEP_KEY, String(step));
    if (selectedTemplateId) setItem(TEMPLATE_KEY, selectedTemplateId);
    else removeKey(TEMPLATE_KEY);
  } else {
    removeKey(ACTIVE_KEY);
    removeKey(STEP_KEY);
    removeKey(TEMPLATE_KEY);
  }
};

export const clearOnboardingSession = () => {
  writeOnboardingComplete(true);
  writeOnboardingSession({ active: false, step: 0, selectedTemplateId: null });
};

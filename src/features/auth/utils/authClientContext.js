import { getItem, setItem, removeKey } from '@/utils/localStorageSafe';

const LAST_WORKSPACE_KEY = 'clearform:last-workspace-id';
const ONBOARDING_HINT_KEY = 'clearform:onboarding-hint';

export function readLastWorkspaceId() {
  const id = getItem(LAST_WORKSPACE_KEY);
  return id && id.trim() ? id.trim() : null;
}

export function writeLastWorkspaceId(workspaceId) {
  if (!workspaceId) return;
  setItem(LAST_WORKSPACE_KEY, String(workspaceId));
}

export function readOnboardingHint() {
  return getItem(ONBOARDING_HINT_KEY) === 'true';
}

export function writeOnboardingHint(completed) {
  if (completed) {
    removeKey(ONBOARDING_HINT_KEY);
  } else {
    setItem(ONBOARDING_HINT_KEY, 'true');
  }
}

export function clearAuthClientContext() {
  removeKey(LAST_WORKSPACE_KEY);
  removeKey(ONBOARDING_HINT_KEY);
}

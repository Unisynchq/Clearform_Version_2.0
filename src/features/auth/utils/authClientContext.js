const LAST_WORKSPACE_KEY = 'clearform:last-workspace-id';
const ONBOARDING_HINT_KEY = 'clearform:onboarding-hint';

export function readLastWorkspaceId() {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(LAST_WORKSPACE_KEY);
  return id && id.trim() ? id.trim() : null;
}

export function writeLastWorkspaceId(workspaceId) {
  if (typeof window === 'undefined' || !workspaceId) return;
  localStorage.setItem(LAST_WORKSPACE_KEY, String(workspaceId));
}

export function readOnboardingHint() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ONBOARDING_HINT_KEY) === 'true';
}

export function writeOnboardingHint(completed) {
  if (typeof window === 'undefined') return;
  if (completed) {
    localStorage.removeItem(ONBOARDING_HINT_KEY);
  } else {
    localStorage.setItem(ONBOARDING_HINT_KEY, 'true');
  }
}

export function clearAuthClientContext() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LAST_WORKSPACE_KEY);
  localStorage.removeItem(ONBOARDING_HINT_KEY);
}

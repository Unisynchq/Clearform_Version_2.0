import { getItem, setItem, removeKey } from '@/utils/localStorageSafe';

/** Prevents duplicate sync/navigate during Microsoft redirect + session bridge. */

let syncInFlight = null;
let redirectHandlerOwnsNavigation = false;
let logoutInProgress = false;
let authRestoreInFlight = null;
const AUTH_LOGOUT_KEY = 'clearform:auth-logout-in-progress';
const AUTH_LOGOUT_GRACE_MS = 15000;
const AUTH_RESTORE_COOLDOWN_MS = 4000;
let lastAuthRestoreAttemptAt = 0;

function readLogoutMarker() {
  const raw = getItem(AUTH_LOGOUT_KEY);
  if (!raw) return false;

  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt > AUTH_LOGOUT_GRACE_MS) {
    removeKey(AUTH_LOGOUT_KEY);
    return false;
  }

  return true;
}

export function beginRedirectHandlerNavigation() {
  redirectHandlerOwnsNavigation = true;
}

export function endRedirectHandlerNavigation() {
  redirectHandlerOwnsNavigation = false;
}

export function shouldSessionBridgeNavigate({ pendingMicrosoft, pathname }) {
  if (redirectHandlerOwnsNavigation) return false;
  // CLE-46: do NOT block /signin when oauth pending — that left returning Google
  // users with a success toast but no navigation until manual reload.
  void pendingMicrosoft;
  void pathname;
  return true;
}

export function runSingleFlightSync(syncFn) {
  if (syncInFlight) return syncInFlight;
  syncInFlight = syncFn().finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

export function resetAuthBootstrapCoordinator() {
  syncInFlight = null;
  redirectHandlerOwnsNavigation = false;
}

export function beginAuthLogout() {
  logoutInProgress = true;
  setItem(AUTH_LOGOUT_KEY, String(Date.now()));
}

export function endAuthLogout() {
  logoutInProgress = false;
  removeKey(AUTH_LOGOUT_KEY);
}

export function clearLogoutMarker() {
  endAuthLogout();
}

export function isAuthLogoutInProgress() {
  return logoutInProgress || readLogoutMarker();
}

export function isAuthRestoreInProgress() {
  return authRestoreInFlight != null;
}

export function canAttemptAuthRestore() {
  if (typeof window === 'undefined') return true;
  return Date.now() - lastAuthRestoreAttemptAt > AUTH_RESTORE_COOLDOWN_MS;
}

export function runSingleFlightAuthRestore(restoreFn) {
  if (authRestoreInFlight) return authRestoreInFlight;
  lastAuthRestoreAttemptAt = Date.now();
  authRestoreInFlight = restoreFn().finally(() => {
    authRestoreInFlight = null;
  });
  return authRestoreInFlight;
}

export function resetAuthRestoreCoordinator() {
  authRestoreInFlight = null;
  lastAuthRestoreAttemptAt = 0;
}

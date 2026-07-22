/** Prevents duplicate sync/navigate during Microsoft redirect + session bridge. */

let syncInFlight = null;
let redirectHandlerOwnsNavigation = false;

export function beginRedirectHandlerNavigation() {
  redirectHandlerOwnsNavigation = true;
}

export function endRedirectHandlerNavigation() {
  redirectHandlerOwnsNavigation = false;
}

export function shouldSessionBridgeNavigate({ pendingMicrosoft, pathname }) {
  if (redirectHandlerOwnsNavigation) return false;
  if (pendingMicrosoft && pathname === '/signin') return false;
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

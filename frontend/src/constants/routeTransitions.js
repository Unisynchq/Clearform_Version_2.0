import { premiumTransition } from './premiumTransition';

/** Route groups for AnimatePresence — old group must exit before new group enters */
export function getRouteTransitionKey(pathname) {
  if (pathname.startsWith('/dashboard/form-builder')) return 'form-builder';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/onboarding')) return 'onboarding';
  return 'auth';
}

export const ROUTE_TRANSITION_EASE = [0.25, 0.1, 0.25, 1];

export const DASHBOARD_ROUTE_EXIT = {
  opacity: 0,
  x: -20,
  transition: { duration: 0.2, ease: 'easeIn' },
};

export const BUILDER_ROUTE_ENTER = {
  opacity: 1,
  transition: premiumTransition,
};

export const BUILDER_ROUTE_EXIT = {
  opacity: 0,
  transition: premiumTransition,
};

/** Minimum overlay time while navigating dashboard → builder */
export const BUILDER_NAV_MIN_MS = 420;

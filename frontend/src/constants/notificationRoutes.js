/**
 * Canonical in-app targets for notification actions.
 * Use routeKey + params (preferred) or navigateTo (legacy persisted notifications).
 */
export const NOTIFICATION_ROUTE_KEYS = {
  profile: 'profile',
  security: 'security',
  billing: 'billing',
  analytics: 'analytics',
  dashboard: 'dashboard',
};

const PROFILE_BASE = '/dashboard/profile';

export const NOTIFICATION_ROUTES = {
  [NOTIFICATION_ROUTE_KEYS.profile]: `${PROFILE_BASE}?tab=profile`,
  [NOTIFICATION_ROUTE_KEYS.security]: `${PROFILE_BASE}?tab=security`,
  [NOTIFICATION_ROUTE_KEYS.billing]: `${PROFILE_BASE}?tab=billing`,
  [NOTIFICATION_ROUTE_KEYS.dashboard]: '/dashboard',
};

/**
 * @param {string} routeKey
 * @param {Record<string, string | number>} [params]
 * @returns {string | null}
 */
export function buildNotificationPath(routeKey, params = {}) {
  if (routeKey === NOTIFICATION_ROUTE_KEYS.analytics) {
    const formId = params.formId;
    if (formId == null || formId === '') return '/dashboard/analytics';
    return `/dashboard/analytics?form=${encodeURIComponent(String(formId))}`;
  }

  const base = NOTIFICATION_ROUTES[routeKey];
  if (!base) return null;
  return base;
}

/**
 * Resolve navigation target from a notification action payload.
 * @param {{ routeKey?: string, params?: Record<string, string | number>, navigateTo?: string }} action
 * @returns {string | null}
 */
export function resolveNotificationPath(action) {
  if (!action) return null;

  if (action.routeKey) {
    const built = buildNotificationPath(action.routeKey, action.params ?? {});
    if (built) return built;
  }

  const legacy = action.navigateTo;
  if (typeof legacy === 'string' && legacy.startsWith('/dashboard')) {
    return legacy;
  }

  return null;
}

/**
 * @param {string} path
 */
export function isAllowedNotificationPath(path) {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/dashboard')) return false;
  if (path.includes('//') || path.includes('..')) return false;
  return true;
}

/**
 * @param {{ label: string, style?: string, routeKey: string, params?: Record<string, string | number> }} opts
 */
export function notificationAction({ label, style = 'primary', routeKey, params }) {
  return {
    label,
    style,
    routeKey,
    params: params ?? {},
    navigateTo: buildNotificationPath(routeKey, params ?? {}),
  };
}

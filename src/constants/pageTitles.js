import { matchPath } from 'react-router-dom';

export const APP_NAME = 'Clearform';

const ROUTE_TITLES = [
  { pattern: '/', title: 'Sign Up' },
  { pattern: '/signin', title: 'Sign In' },
  { pattern: '/onboarding/templates', title: 'Choose a Template' },
  { pattern: '/onboarding', title: 'Welcome' },
  { pattern: '/dashboard/templates', title: 'Templates' },
  { pattern: '/dashboard/analytics', title: 'Analytics' },
  { pattern: '/dashboard/help', title: 'Help & Support' },
  { pattern: '/dashboard/profile', title: 'Profile' },
  { pattern: '/dashboard/form-builder/:formId', title: 'Form Builder', dynamic: true },
  { pattern: '/dashboard/form-builder', title: 'Form Builder' },
  { pattern: '/dashboard', title: 'Dashboard' },
  { pattern: '/f/:formId', title: 'Form', dynamic: true },
];

export function formatPageTitle(pageTitle) {
  return `${pageTitle} · ${APP_NAME}`;
}

/**
 * Resolve a static route title. Pass `dynamicTitle` for form-builder / public form routes.
 */
export function resolvePageTitle(pathname, dynamicTitle) {
  for (const route of ROUTE_TITLES) {
    const match = matchPath({ path: route.pattern, end: true }, pathname);
    if (!match) continue;

    if (route.dynamic && dynamicTitle?.trim()) {
      return formatPageTitle(dynamicTitle.trim());
    }
    return formatPageTitle(route.title);
  }

  return formatPageTitle(APP_NAME);
}

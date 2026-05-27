import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_ROUTE_KEYS,
  buildNotificationPath,
  isAllowedNotificationPath,
  resolveNotificationPath,
} from './notificationRoutes';

describe('notificationRoutes', () => {
  it('builds profile tab paths', () => {
    expect(buildNotificationPath(NOTIFICATION_ROUTE_KEYS.billing)).toBe(
      '/dashboard/profile?tab=billing',
    );
  });

  it('builds analytics path with form id', () => {
    expect(
      buildNotificationPath(NOTIFICATION_ROUTE_KEYS.analytics, { formId: 42 }),
    ).toBe('/dashboard/analytics?form=42');
  });

  it('resolves routeKey over legacy navigateTo', () => {
    const path = resolveNotificationPath({
      routeKey: NOTIFICATION_ROUTE_KEYS.security,
      navigateTo: '/dashboard/wrong',
    });
    expect(path).toBe('/dashboard/profile?tab=security');
  });

  it('rejects external paths', () => {
    expect(isAllowedNotificationPath('https://evil.com')).toBe(false);
    expect(isAllowedNotificationPath('/dashboard/analytics?form=1')).toBe(true);
  });
});

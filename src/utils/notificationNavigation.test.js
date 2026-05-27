import { describe, it, expect, vi } from 'vitest';
import { executeNotificationAction } from './notificationNavigation';
import { NOTIFICATION_ROUTE_KEYS } from '@/constants/notificationRoutes';

describe('executeNotificationAction', () => {
  it('navigates to allowed dashboard path and closes panel', () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();
    const ok = executeNotificationAction(
      { dispatch, navigate },
      { routeKey: NOTIFICATION_ROUTE_KEYS.billing },
    );
    expect(ok).toBe(true);
    expect(dispatch).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/dashboard/profile?tab=billing');
  });

  it('rejects invalid paths', () => {
    const navigate = vi.fn();
    const ok = executeNotificationAction(
      { dispatch: vi.fn(), navigate },
      { navigateTo: 'https://example.com' },
    );
    expect(ok).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

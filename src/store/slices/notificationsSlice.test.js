import { describe, it, expect } from 'vitest';
import notificationsReducer, {
  clearAllNotifications,
  markAllNotificationsRead,
  syncFormAlertNotifications,
  syncSystemAlertNotifications,
  upsertAlertNotification,
} from './notificationsSlice';

describe('notificationsSlice', () => {
  const initial = notificationsReducer(undefined, { type: '@@INIT' });

  it('upsertAlertNotification adds and removes by active flag', () => {
    let state = notificationsReducer(
      initial,
      upsertAlertNotification({
        dedupeKey: 'alert:1:completion',
        active: true,
        notification: {
          type: 'completion_drop',
          category: 'alerts',
          title: 'Test',
          bodySegments: [{ text: 'Hi', bold: false }],
        },
      }),
    );
    expect(state.notifications).toHaveLength(1);

    state = notificationsReducer(
      state,
      upsertAlertNotification({
        dedupeKey: 'alert:1:completion',
        active: false,
        notification: null,
      }),
    );
    expect(state.notifications).toHaveLength(0);
  });

  it('clearAllNotifications clears the feed', () => {
    let state = notificationsReducer(
      initial,
      upsertAlertNotification({
        dedupeKey: 'alert:1:completion',
        active: true,
        notification: {
          type: 'completion_drop',
          category: 'alerts',
          title: 'Test',
          bodySegments: [{ text: 'Hi', bold: false }],
        },
      }),
    );
    expect(state.notifications.length).toBeGreaterThan(0);
    state = notificationsReducer(state, clearAllNotifications());
    expect(state.notifications).toHaveLength(0);
  });

  it('syncSystemAlertNotifications removes inactive system keys', () => {
    let state = notificationsReducer(
      initial,
      syncSystemAlertNotifications({
        items: [
          {
            dedupeKey: 'system:usage:forms',
            active: true,
            notification: {
              type: 'usage_limit',
              category: 'alerts',
              title: 'Form limit',
              bodySegments: [{ text: 'Limit', bold: false }],
            },
          },
          { dedupeKey: 'system:usage:responses', active: false, notification: null },
        ],
      }),
    );
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].dedupeKey).toBe('system:usage:forms');
  });

  it('syncFormAlertNotifications dedupes per form', () => {
    const state = notificationsReducer(
      initial,
      syncFormAlertNotifications({
        formId: 2,
        items: [
          {
            dedupeKey: 'alert:2:milestone',
            active: true,
            notification: {
              type: 'response_milestone',
              category: 'alerts',
              title: 'Milestone',
              bodySegments: [{ text: 'Done', bold: false }],
            },
          },
          {
            dedupeKey: 'alert:2:completion',
            active: false,
            notification: null,
          },
        ],
      }),
    );
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].dedupeKey).toBe('alert:2:milestone');
  });
});

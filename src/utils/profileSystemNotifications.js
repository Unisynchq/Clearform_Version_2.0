import { readProfileSettings } from '@/features/profile/utils/profileSettingsStorage';
import {
  NOTIFICATION_ROUTE_KEYS,
  notificationAction,
} from '@/constants/notificationRoutes';

/**
 * @param {{ email?: string | null }} params
 * @returns {{ dedupeKey: string, active: boolean, notification: object | null }[]}
 */
export function evaluateProfileSystemAlerts({ email }) {
  if (!email) {
    return [
      { dedupeKey: 'system:profile:incomplete', active: false, notification: null },
    ];
  }

  const saved = readProfileSettings(email);
  const incomplete = !saved?.displayName?.trim();

  return [
    {
      dedupeKey: 'system:profile:incomplete',
      active: incomplete,
      notification: incomplete
        ? {
            type: 'profile_incomplete',
            category: 'alerts',
            dateGroup: 'Today',
            iconType: 'warning',
            iconBg: '#fef3e2',
            title: 'Complete your profile',
            titleColor: '#b45309',
            bodySegments: [
              { text: 'Add a display name', bold: true },
              {
                text: ' so teammates recognize you and account alerts reach the right place.',
                bold: false,
              },
            ],
            timestamp: 'Just now',
            action: notificationAction({
              label: 'Go to Profile',
              style: 'primary',
              routeKey: NOTIFICATION_ROUTE_KEYS.profile,
            }),
          }
        : null,
    },
  ];
}

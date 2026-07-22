import {
  NOTIFICATION_ROUTE_KEYS,
  notificationAction,
} from '@/constants/notificationRoutes';

const BILLING_ACTION = notificationAction({
  label: 'View billing',
  style: 'primary',
  routeKey: NOTIFICATION_ROUTE_KEYS.billing,
});

/**
 * Alerts from GET /billing/status (pilot expiry, limits).
 * @param {object | null} apiStatus
 */
export function evaluateBillingStatusAlerts(apiStatus) {
  if (!apiStatus) return [];

  const results = [];

  if (apiStatus.status === 'EXPIRED') {
    results.push({
      dedupeKey: 'system:billing:pilot-expired',
      active: true,
      notification: {
        type: 'billing_status',
        category: 'alerts',
        dateGroup: 'Today',
        iconType: 'warning',
        iconBg: '#fef3e2',
        title: 'Pilot access ended',
        titleColor: '#b45309',
        bodySegments: [
          {
            text: 'Your 90-day pilot has expired. Renew from Profile → Billing to keep AI features and higher limits.',
            bold: false,
          },
        ],
        timestamp: 'Just now',
        action: BILLING_ACTION,
      },
    });
  } else {
    results.push({
      dedupeKey: 'system:billing:pilot-expired',
      active: false,
      notification: null,
    });
  }

  if (apiStatus.planId === 'pilot_35' && apiStatus.expiresAt) {
    const expires = new Date(apiStatus.expiresAt);
    const daysLeft = Math.ceil((expires.getTime() - Date.now()) / 86_400_000);
    const soon = daysLeft > 0 && daysLeft <= 14;
    results.push({
      dedupeKey: 'system:billing:pilot-expiring',
      active: soon,
      notification: soon
        ? {
            type: 'billing_status',
            category: 'alerts',
            dateGroup: 'Today',
            iconType: 'warning',
            iconBg: '#fef3e2',
            title: 'Pilot expiring soon',
            titleColor: '#b45309',
            bodySegments: [
              {
                text: `Your pilot access ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. `,
                bold: false,
              },
              { text: 'Review billing to extend access.', bold: true },
            ],
            timestamp: 'Just now',
            action: BILLING_ACTION,
          }
        : null,
    });
  } else {
    results.push({
      dedupeKey: 'system:billing:pilot-expiring',
      active: false,
      notification: null,
    });
  }

  return results;
}

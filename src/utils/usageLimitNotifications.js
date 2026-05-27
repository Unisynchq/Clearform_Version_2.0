import {
  getUsageHint,
  getUsageStatus,
} from '@/features/profile/utils/profileBillingDefaults';
import {
  NOTIFICATION_ROUTE_KEYS,
  notificationAction,
} from '@/constants/notificationRoutes';

const UPGRADE_ACTION = notificationAction({
  label: 'Upgrade plan',
  style: 'primary',
  routeKey: NOTIFICATION_ROUTE_KEYS.billing,
});

function alertPayload({ title, titleColor, bodySegments, action = UPGRADE_ACTION }) {
  return {
    type: 'usage_limit',
    category: 'alerts',
    dateGroup: 'Today',
    iconType: 'warning',
    iconBg: '#fef3e2',
    title,
    titleColor: titleColor ?? '#b45309',
    bodySegments,
    timestamp: 'Just now',
    action,
  };
}

/**
 * @param {ReturnType<import('@/features/profile/utils/workspaceUsageMetrics').getWorkspaceUsageMetrics>} metrics
 * @returns {{ dedupeKey: string, active: boolean, notification: object | null }[]}
 */
export function evaluateUsageLimitAlerts(metrics) {
  if (!metrics) return [];

  const {
    formsUsed,
    responsesUsed,
    teamUsed,
    formsLimit,
    responsesLimit,
    teamLimit,
    planName,
  } = metrics;

  const results = [];

  const formsStatus = getUsageStatus(formsUsed, formsLimit);
  const formsActive = formsStatus === 'at-limit';
  results.push({
    dedupeKey: 'system:usage:forms',
    active: formsActive,
    notification: formsActive
      ? alertPayload({
          title: 'Form limit reached',
          bodySegments: [
            { text: `You've used all ${formsLimit} forms on your ${planName} plan. `, bold: false },
            { text: getUsageHint('forms', formsUsed, formsLimit, formsStatus), bold: true },
          ],
        })
      : null,
  });

  const responsesStatus = getUsageStatus(responsesUsed, responsesLimit);
  const responsesActive = responsesStatus === 'near-limit' || responsesStatus === 'at-limit';
  results.push({
    dedupeKey: 'system:usage:responses',
    active: responsesActive,
    notification: responsesActive
      ? alertPayload({
          title:
            responsesStatus === 'at-limit'
              ? 'Response limit reached'
              : 'Approaching response limit',
          bodySegments: [
            {
              text: `${responsesUsed.toLocaleString()} / ${responsesLimit.toLocaleString()} responses this month on ${planName}. `,
              bold: false,
            },
            {
              text: getUsageHint('responses', responsesUsed, responsesLimit, responsesStatus),
              bold: true,
            },
          ],
        })
      : null,
  });

  const teamStatus = getUsageStatus(teamUsed, teamLimit);
  const teamActive = teamStatus === 'at-limit';
  results.push({
    dedupeKey: 'system:usage:team',
    active: teamActive,
    notification: teamActive
      ? alertPayload({
          title: 'Team seat limit reached',
          bodySegments: [
            {
              text: `${teamUsed} / ${teamLimit} team members on your ${planName} plan. `,
              bold: false,
            },
            { text: getUsageHint('team', teamUsed, teamLimit, teamStatus), bold: true },
          ],
        })
      : null,
  });

  return results;
}

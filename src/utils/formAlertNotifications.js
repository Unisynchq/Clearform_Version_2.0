import { deriveFormStatsFromApi } from '@/components/analytics/analyticsStats';
import { mergeAlertSettings } from '@/utils/formAlertDefaults';
import {
  NOTIFICATION_ROUTE_KEYS,
  notificationAction,
} from '@/constants/notificationRoutes';

function formAnalyticsAction(formId) {
  return notificationAction({
    label: 'View analytics',
    style: 'primary',
    routeKey: NOTIFICATION_ROUTE_KEYS.analytics,
    params: { formId },
  });
}

function sentimentNegativePct() {
  return 0;
}

/**
 * Evaluate enabled alert rules for a form. Returns items for syncFormAlertNotifications.
 * @param {object} form
 * @returns {{ dedupeKey: string, active: boolean, notification: object | null }[]}
 */
export function evaluateFormAlerts(form) {
  if (!form?.id) return [];

  const settings = mergeAlertSettings(form.alertSettings);
  const stats = deriveFormStatsFromApi(form, null);
  const title = form.title ?? 'Untitled form';
  const formId = form.id;
  const responses = form.responses ?? 0;
  const negativePct = sentimentNegativePct();
  const results = [];

  if (settings.completion.enabled) {
    const threshold = Number(settings.completion.thresholdPct) || 50;
    results.push({
      dedupeKey: `alert:${formId}:completion`,
      active: stats.conversionPct < threshold,
      notification: {
        type: 'completion_drop',
        category: 'alerts',
        dateGroup: 'Today',
        iconType: 'warning',
        iconBg: '#fef3e2',
        title: 'Completion rate dropped',
        titleColor: '#b45309',
        bodySegments: [
          { text: title, bold: true },
          {
            text: ` completion is ${stats.conversionPct}% (below your ${threshold}% threshold).`,
            bold: false,
          },
        ],
        timestamp: 'Just now',
        formId,
        action: formAnalyticsAction(formId),
      },
    });
  } else {
    results.push({
      dedupeKey: `alert:${formId}:completion`,
      active: false,
      notification: null,
    });
  }

  if (settings.milestone.enabled) {
    const target = Number(settings.milestone.value) || 500;
    results.push({
      dedupeKey: `alert:${formId}:milestone`,
      active: responses >= target,
      notification: {
        type: 'response_milestone',
        category: 'alerts',
        dateGroup: 'Today',
        iconType: 'check',
        iconBg: '#ddffce',
        title: 'Response milestone reached',
        titleColor: '#15803d',
        bodySegments: [
          { text: title, bold: true },
          {
            text: ` reached ${responses.toLocaleString()} responses (milestone: ${target.toLocaleString()}).`,
            bold: false,
          },
        ],
        timestamp: 'Just now',
        formId,
        action: formAnalyticsAction(formId),
      },
    });
  } else {
    results.push({ dedupeKey: `alert:${formId}:milestone`, active: false, notification: null });
  }

  if (settings.sentiment.enabled) {
    const threshold = Number(settings.sentiment.thresholdPct) || 1;
    results.push({
      dedupeKey: `alert:${formId}:sentiment`,
      active: negativePct >= threshold,
      notification: {
        type: 'sentiment_spike',
        category: 'alerts',
        dateGroup: 'Today',
        iconType: 'warning',
        iconBg: '#fdecea',
        title: 'Negative sentiment spike',
        titleColor: '#c53030',
        bodySegments: [
          { text: title, bold: true },
          {
            text: ` has ${negativePct}% negative sentiment today (threshold: ${threshold}%).`,
            bold: false,
          },
        ],
        timestamp: 'Just now',
        formId,
        action: formAnalyticsAction(formId),
      },
    });
  } else {
    results.push({ dedupeKey: `alert:${formId}:sentiment`, active: false, notification: null });
  }

  return results;
}

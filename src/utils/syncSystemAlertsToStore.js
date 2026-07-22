import { getWorkspaceUsageMetrics } from '@/features/profile/utils/workspaceUsageMetrics';
import { evaluateProfileSystemAlerts } from '@/utils/profileSystemNotifications';
import { evaluateUsageLimitAlerts } from '@/utils/usageLimitNotifications';
import { evaluateBillingStatusAlerts } from '@/utils/billingStatusNotifications';
import { syncSystemAlertNotifications } from '@/store/slices/notificationsSlice';

/** Evaluate usage + profile + billing alerts and sync into notifications slice. */
export function dispatchSyncSystemAlerts(dispatch, state, { apiBilling } = {}) {
  const forms = state.forms?.forms ?? [];
  const email = state.auth?.email ?? null;
  const responsesByFormId = state.forms?.responsesByFormId ?? {};

  const metrics = getWorkspaceUsageMetrics({
    forms,
    email,
    responsesByFormId,
    apiBilling,
  });
  const items = [
    ...evaluateUsageLimitAlerts(metrics),
    ...evaluateBillingStatusAlerts(apiBilling),
    ...evaluateProfileSystemAlerts({ email }),
  ];

  dispatch(syncSystemAlertNotifications({ items }));
}

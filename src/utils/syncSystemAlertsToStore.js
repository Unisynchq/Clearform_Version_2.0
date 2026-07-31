import { getWorkspaceUsageMetrics } from '@/features/profile/utils/workspaceUsageMetrics';
import { evaluateProfileSystemAlerts } from '@/utils/profileSystemNotifications';
import { evaluateUsageLimitAlerts } from '@/utils/usageLimitNotifications';
import { evaluateBillingStatusAlerts } from '@/utils/billingStatusNotifications';
import { syncSystemAlertNotifications } from '@/store/slices/notificationsSlice';

/** Evaluate usage + profile + billing alerts and sync into notifications slice. */
export function dispatchSyncSystemAlerts(dispatch, state, { apiBilling } = {}) {
  // Real notifications will be fetched from server API.
  // Disabled auto-generated local synthetic alerts.
  const items = [];
  dispatch(syncSystemAlertNotifications({ items }));
}

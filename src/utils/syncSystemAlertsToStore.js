import { getWorkspaceUsageMetrics } from '@/features/profile/utils/workspaceUsageMetrics';
import { evaluateProfileSystemAlerts } from '@/utils/profileSystemNotifications';
import { evaluateUsageLimitAlerts } from '@/utils/usageLimitNotifications';
import { syncSystemAlertNotifications } from '@/store/slices/notificationsSlice';

/** Evaluate usage + profile system alerts and sync into notifications slice. */
export function dispatchSyncSystemAlerts(dispatch, state) {
  const forms = state.forms?.forms ?? [];
  const email = state.auth?.email ?? null;
  const responsesByFormId = state.forms?.responsesByFormId ?? {};

  const metrics = getWorkspaceUsageMetrics({ forms, email, responsesByFormId });
  const items = [
    ...evaluateUsageLimitAlerts(metrics),
    ...evaluateProfileSystemAlerts({ email }),
  ];

  dispatch(syncSystemAlertNotifications({ items }));
}

import { evaluateFormAlerts } from '@/utils/formAlertNotifications';
import { syncFormAlertNotifications } from '@/store/slices/notificationsSlice';

/** Dispatch alert evaluation for one form into the notifications slice. */
export function dispatchSyncFormAlerts(dispatch, form) {
  if (!form?.id) return;
  const items = evaluateFormAlerts(form);
  dispatch(syncFormAlertNotifications({ formId: form.id, items }));
}

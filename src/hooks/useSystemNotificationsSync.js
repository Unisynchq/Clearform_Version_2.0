import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dispatchSyncSystemAlerts } from '@/utils/syncSystemAlertsToStore';

/**
 * Keeps usage-limit and profile system alerts in sync with Redux + local profile/billing state.
 */
export default function useSystemNotificationsSync() {
  const dispatch = useDispatch();
  const forms = useSelector((s) => s.forms.forms);
  const responsesByFormId = useSelector((s) => s.forms.responsesByFormId);
  const email = useSelector((s) => s.auth.email);

  const responseCount = useSelector((s) => {
    const map = s.forms.responsesByFormId ?? {};
    return Object.values(map).reduce(
      (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
      0,
    );
  });

  useEffect(() => {
    dispatchSyncSystemAlerts(dispatch, {
      forms: { forms, responsesByFormId },
      auth: { email },
    });
  }, [dispatch, forms, forms.length, email, responsesByFormId, responseCount]);
}

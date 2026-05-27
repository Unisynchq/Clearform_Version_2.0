import { closeNotificationCenter } from '@/store/slices/uiSlice';
import {
  isAllowedNotificationPath,
  resolveNotificationPath,
} from '@/constants/notificationRoutes';

/**
 * Navigate from a notification action (closes panel first).
 * @param {{ dispatch: Function, navigate: Function }} ctx
 * @param {{ routeKey?: string, params?: object, navigateTo?: string }} action
 * @returns {boolean} whether navigation ran
 */
export function executeNotificationAction({ dispatch, navigate }, action) {
  const path = resolveNotificationPath(action);
  if (!path || !isAllowedNotificationPath(path)) return false;

  dispatch(closeNotificationCenter());
  navigate(path);
  return true;
}

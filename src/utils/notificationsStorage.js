import { readJson, writeJson } from '@/utils/localStorageSafe';

const NOTIFICATIONS_KEY = 'clearform_notifications';

export const readNotifications = () => {
  const parsed = readJson(NOTIFICATIONS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
};

export const writeNotifications = (notifications) => {
  writeJson(NOTIFICATIONS_KEY, notifications);
};

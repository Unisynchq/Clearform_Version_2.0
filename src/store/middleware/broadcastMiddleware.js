const CHANNEL_NAME = 'clearform-cross-tab';

const BROADCAST_ACTIONS = new Set([
  'auth/logout',
  'notifications/clearAllNotifications',
  'notifications/markAllNotificationsRead',
]);

export const broadcastMiddleware = () => (next) => (action) => {
  const result = next(action);
  if (BROADCAST_ACTIONS.has(action.type)) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: action.type });
      channel.close();
    } catch {
      // BroadcastChannel unavailable — graceful no-op
    }
  }
  return result;
};

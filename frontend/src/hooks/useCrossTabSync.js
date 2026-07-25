import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { clearAllNotifications, markAllNotificationsRead } from '@/store/slices/notificationsSlice';

const CHANNEL_NAME = 'clearform-cross-tab';

export function useCrossTabSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return;
    }

    channel.onmessage = (event) => {
      const { type } = event.data ?? {};
      switch (type) {
        case 'auth/logout':
          dispatch(logout());
          break;
        case 'notifications/clearAllNotifications':
          dispatch(clearAllNotifications());
          break;
        case 'notifications/markAllNotificationsRead':
          dispatch(markAllNotificationsRead());
          break;
      }
    };

    return () => channel.close();
  }, [dispatch]);
}

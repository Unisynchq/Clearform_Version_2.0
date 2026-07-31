import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  receiveRealtimeNotification,
  setUnreadCount,
  loadNotificationsFromApi,
} from '@/store/slices/notificationsSlice';
import { getUnreadCount } from '@/api/services/notificationsService';
import { isApiConfigured } from '@/config/env';

const POLL_INTERVAL = 15_000;

export function useRealtimeNotifications() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !isApiConfigured()) return;

    const poll = async () => {
      try {
        const { count } = await getUnreadCount();
        dispatch(setUnreadCount(count));
      } catch {
        // Silently retry on next poll
      }
    };

    // Initial poll
    poll();

    // Poll for unread count at regular intervals
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);

    // Full refresh at a slower interval
    const fullRefreshTimer = setInterval(() => {
      dispatch(loadNotificationsFromApi());
    }, POLL_INTERVAL * 4);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      clearInterval(fullRefreshTimer);
    };
  }, [isAuthenticated, dispatch]);
}

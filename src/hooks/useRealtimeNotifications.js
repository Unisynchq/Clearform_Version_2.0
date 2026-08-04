import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setUnreadCount,
  loadNotificationsFromApi,
} from '@/store/slices/notificationsSlice';
import { getUnreadCount } from '@/api/services/notificationsService';
import { getFreshAuthToken } from '@/features/auth/utils/authTokenRefresh';
import { isApiConfigured } from '@/config/env';

const POLL_INTERVAL = 15_000;

export function useRealtimeNotifications() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isInitialized = useSelector((state) => state.auth.isInitialized);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !isApiConfigured()) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const token = await getFreshAuthToken();
        if (!token || cancelled) return;
        const { count } = await getUnreadCount();
        if (!cancelled) dispatch(setUnreadCount(count));
      } catch {
        // Silently retry on next poll
      }
    };

    void poll();

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);

    const fullRefreshTimer = setInterval(() => {
      void getFreshAuthToken().then((token) => {
        if (token) dispatch(loadNotificationsFromApi());
      });
    }, POLL_INTERVAL * 4);

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      clearInterval(fullRefreshTimer);
    };
  }, [isInitialized, isAuthenticated, dispatch]);
}

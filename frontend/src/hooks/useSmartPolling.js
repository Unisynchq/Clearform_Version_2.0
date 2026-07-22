import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_FOCUS_REFETCH_GAP_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;

/**
 * Poll `fetchFn` on an interval while the tab is visible, refetch immediately
 * on focus/visibility (throttled), and back off exponentially on errors.
 * Keeps dashboards feeling real-time without a socket.
 *
 * `fetchFn` should be a stable callback (useCallback) that performs the fetch
 * and updates its own state; this hook only schedules it.
 *
 * @param {() => Promise<void> | void} fetchFn
 * @param {{ intervalMs?: number, enabled?: boolean }} [options]
 * @returns {{ lastUpdatedAt: number | null, refresh: () => void }}
 */
export function useSmartPolling(fetchFn, { intervalMs = 30_000, enabled = true } = {}) {
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const lastRunAtRef = useRef(0);
  const failureCountRef = useRef(0);
  const timerRef = useRef(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const runFetch = useCallback(async () => {
    lastRunAtRef.current = Date.now();
    try {
      await fetchFnRef.current();
      failureCountRef.current = 0;
      setLastUpdatedAt(Date.now());
    } catch {
      failureCountRef.current += 1;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const currentDelay = () =>
      Math.min(intervalMs * 2 ** failureCountRef.current, MAX_BACKOFF_MS);

    const schedule = () => {
      timerRef.current = window.setTimeout(async () => {
        if (document.visibilityState === 'visible') {
          await runFetch();
        }
        schedule();
      }, currentDelay());
    };

    const onFocus = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRunAtRef.current < MIN_FOCUS_REFETCH_GAP_MS) return;
      runFetch();
    };

    schedule();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [enabled, intervalMs, runFetch]);

  return { lastUpdatedAt, refresh: runFetch };
}

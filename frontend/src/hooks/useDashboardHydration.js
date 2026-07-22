import { useEffect, useState } from 'react';
import { useHydrationFrame } from '@/hooks/useHydrationFrame';
import { DASHBOARD_MIN_LOAD_MS } from '@/motion/dashboardMotion';

/**
 * Dashboard hydration: wait for Redux/localStorage paint, then keep skeleton
 * visible for a short minimum so content does not pop in instantly.
 */
export function useDashboardHydration(minMs = DASHBOARD_MIN_LOAD_MS) {
  const hydrationReady = useHydrationFrame();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrationReady) {
      setReady(false);
      return undefined;
    }
    const timer = setTimeout(() => setReady(true), minMs);
    return () => clearTimeout(timer);
  }, [hydrationReady, minMs]);

  return ready;
}

import { useLayoutEffect, useState } from 'react';

/**
 * Waits two animation frames so sync-hydrated Redux/localStorage data can paint once
 * without artificial multi-second loading timers.
 */
export function useHydrationFrame(enabled = true) {
  const [ready, setReady] = useState(!enabled);

  useLayoutEffect(() => {
    if (!enabled) {
      setReady(true);
      return undefined;
    }
    setReady(false);
    let frame2;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(frame1);
      if (frame2) cancelAnimationFrame(frame2);
    };
  }, [enabled]);

  return ready;
}

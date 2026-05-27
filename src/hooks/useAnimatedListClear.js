import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_EXIT_MS = 280;
const DEFAULT_STAGGER_S = 0.028;

/**
 * Staged list clear: animate items out, then run a destructive callback (e.g. Redux).
 *
 * @param {object} options
 * @param {number} [options.exitMs]
 * @param {number} [options.staggerS]
 * @param {() => void} options.onClear — runs after exit animation completes
 */
export function useAnimatedListClear({ exitMs = DEFAULT_EXIT_MS, staggerS = DEFAULT_STAGGER_S, onClear }) {
  const [isClearing, setIsClearing] = useState(false);
  const [exitList, setExitList] = useState(null);
  const clearingCountRef = useRef(0);
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  const getExitDurationMs = useCallback(
    (itemCount) => {
      const staggerMs = Math.max(0, itemCount - 1) * staggerS * 1000;
      return exitMs + staggerMs + 40;
    },
    [exitMs, staggerS],
  );

  useEffect(() => {
    if (!isClearing || exitList === null || exitList.length > 0) return undefined;
    const timer = window.setTimeout(() => {
      onClearRef.current?.();
      setExitList(null);
      setIsClearing(false);
    }, getExitDurationMs(clearingCountRef.current));
    return () => window.clearTimeout(timer);
  }, [isClearing, exitList, getExitDurationMs]);

  const startClear = useCallback(
    (currentItems) => {
      if (isClearing || !currentItems?.length) return false;
      clearingCountRef.current = currentItems.length;
      setIsClearing(true);
      setExitList(currentItems);
      window.setTimeout(() => setExitList([]), 0);
      return true;
    },
    [isClearing],
  );

  const resolveDisplayList = useCallback(
    (liveList) => (exitList !== null ? exitList : liveList),
    [exitList],
  );

  return {
    isClearing,
    startClear,
    resolveDisplayList,
  };
}

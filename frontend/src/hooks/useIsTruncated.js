import { useLayoutEffect, useState } from 'react';

/** Returns whether an element's text is visually truncated (ellipsis). */
export function useIsTruncated(ref, deps = []) {
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const measure = () => {
      setTruncated(el.scrollWidth > el.clientWidth + 1);
    };

    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, deps);

  return truncated;
}

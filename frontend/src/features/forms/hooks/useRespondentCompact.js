import { useEffect, useState } from 'react';

const COMPACT_QUERY = '(max-width: 639px)';

/**
 * True when the viewport is phone-sized (live /f/:id and resized browser).
 */
export function useRespondentCompact() {
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(COMPACT_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const onChange = (e) => setCompact(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}

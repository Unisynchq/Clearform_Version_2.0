import { useMemo } from 'react';

/**
 * Derived KPI / limit metrics for the form overview overlay.
 */
export function useFormOverlayMetrics(form, responseLimit) {
  return useMemo(() => {
    const limitNum = parseInt(responseLimit, 10) || 0;
    const responses = form?.responses ?? 0;
    const completionPct = form && responses > 0 ? Math.round((responses / 500) * 100) : 0;
    const limitReached = limitNum > 0 && !!form && responses >= limitNum;
    const limitPct =
      limitNum > 0 && form ? Math.min(100, Math.round((responses / limitNum) * 100)) : 0;
    const nearLimit = limitNum > 0 && form && !limitReached && limitPct >= 75;
    const remaining = limitNum > 0 && form ? Math.max(0, limitNum - responses) : 0;
    const avgRate = form?.daysActive ? (responses / form.daysActive).toFixed(1) : null;
    const daysToTarget =
      avgRate && remaining > 0 ? Math.round(remaining / parseFloat(avgRate, 10)) : null;

    return {
      completionPct,
      limitNum,
      limitReached,
      limitPct,
      nearLimit,
      remaining,
      avgRate,
      daysToTarget,
    };
  }, [form, responseLimit]);
}

import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFormOverlayMetrics } from './useFormOverlayMetrics';

describe('useFormOverlayMetrics', () => {
  it('computes limit metrics from form and response limit', () => {
    const form = { responses: 80, daysActive: 10 };
    const { result } = renderHook(() => useFormOverlayMetrics(form, '100'));
    expect(result.current.limitPct).toBe(80);
    expect(result.current.nearLimit).toBe(true);
    expect(result.current.remaining).toBe(20);
  });
});

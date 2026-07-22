import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHydrationFrame } from './useHydrationFrame';

describe('useHydrationFrame', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('becomes ready after two animation frames', () => {
    const queue = [];
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      queue.push(cb);
      return queue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { result } = renderHook(() => useHydrationFrame(true));
    expect(result.current).toBe(false);

    act(() => {
      queue.shift()?.(0);
    });
    expect(result.current).toBe(false);

    act(() => {
      queue.shift()?.(0);
    });
    expect(result.current).toBe(true);
  });

  it('starts ready when disabled', () => {
    const { result } = renderHook(() => useHydrationFrame(false));
    expect(result.current).toBe(true);
  });
});

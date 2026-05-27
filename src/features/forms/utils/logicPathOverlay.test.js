import { describe, it, expect } from 'vitest';
import { getLogicPathPointAtLength } from './logicPathOverlay';

describe('logicPathOverlay', () => {
  it('samples midpoint on a straight path', () => {
    const p = getLogicPathPointAtLength('M 0 0 L 100 0', 0.5);
    expect(p.x).toBeCloseTo(50, 0);
    expect(p.y).toBeCloseTo(0, 0);
  });

  it('returns origin for empty path', () => {
    expect(getLogicPathPointAtLength('', 0.5)).toEqual({ x: 0, y: 0 });
  });
});

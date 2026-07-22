import { describe, expect, it } from 'vitest';
import { buildLogicConnectionPath, logicBezierConnectionPath } from './logicCanvasGeometry';

describe('logicCanvasGeometry', () => {
  it('builds a bezier path with no obstacles', () => {
    const meta = buildLogicConnectionPath(0, 0, 200, 100, []);
    expect(meta.type).toBe('bezier');
    expect(meta.d).toBe(logicBezierConnectionPath(0, 0, 200, 100));
  });
});

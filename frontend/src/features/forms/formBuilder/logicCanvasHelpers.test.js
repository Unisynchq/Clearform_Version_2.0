import { describe, expect, it } from 'vitest';
import { reorderScreensFromLogicConnections } from './logicCanvasHelpers';
import { LOGIC_EDGE_KIND } from './logicEdgeModel';

describe('logicCanvasHelpers', () => {
  it('reorders content screens along primary next edges from intro', () => {
    const screens = [
      { id: 1, type: 'intro' },
      { id: 2, type: 'content', label: 'A' },
      { id: 3, type: 'content', label: 'B' },
      { id: 4, type: 'end' },
    ];
    const connections = [
      { from: 1, to: 2, kind: LOGIC_EDGE_KIND.next },
      { from: 2, to: 3, kind: LOGIC_EDGE_KIND.next },
      { from: 3, to: 4, kind: LOGIC_EDGE_KIND.next },
    ];
    const ordered = reorderScreensFromLogicConnections(screens, connections);
    expect(ordered.map((s) => s.id)).toEqual([1, 2, 3, 4]);
  });
});

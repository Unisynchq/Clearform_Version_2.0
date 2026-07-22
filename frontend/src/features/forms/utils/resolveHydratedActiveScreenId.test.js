import { describe, expect, it } from 'vitest';
import {
  resolveHydratedActiveScreenId,
  shouldSkipStaleSnapshotHydrate,
} from './resolveHydratedActiveScreenId';

const introEnd = [
  { id: 1, type: 'intro' },
  { id: 2, type: 'end' },
];

describe('resolveHydratedActiveScreenId', () => {
  it('keeps prevActive when id exists in built screens', () => {
    const built = [...introEnd, { id: 5, type: 'content', label: 'Upload' }];
    expect(resolveHydratedActiveScreenId(built, 5, { isRehydrate: true })).toBe(5);
  });

  it('does not reset to intro on rehydrate when prev id missing from stale snapshot', () => {
    expect(resolveHydratedActiveScreenId(introEnd, 5, { isRehydrate: true })).toBe(5);
  });

  it('defaults to first content screen on initial hydrate', () => {
    const built = [...introEnd, { id: 3, type: 'content' }];
    expect(resolveHydratedActiveScreenId(built, null, { isRehydrate: false })).toBe(3);
  });

  it('falls back to intro only on first load with no content screens', () => {
    expect(resolveHydratedActiveScreenId(introEnd, null, { isRehydrate: false })).toBe(1);
  });
});

describe('shouldSkipStaleSnapshotHydrate', () => {
  it('skips when local has more screens than snapshot', () => {
    const local = [...introEnd, { id: 5, type: 'content' }];
    expect(shouldSkipStaleSnapshotHydrate(local, introEnd)).toBe(true);
  });

  it('does not skip when ids match', () => {
    expect(shouldSkipStaleSnapshotHydrate(introEnd, introEnd)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { countNavForms, syncWorkspaceCounts } from './workspacesStorage';

describe('countNavForms', () => {
  const forms = [
    { id: 1, status: 'live', workspace: 'a' },
    { id: 2, status: 'archived', workspace: 'a' },
    { id: 3, status: 'draft', workspace: 'b' },
  ];

  it('excludes archived forms from totals', () => {
    expect(countNavForms(forms)).toBe(2);
  });

  it('scopes counts to a workspace', () => {
    expect(countNavForms(forms, { workspaceId: 'a' })).toBe(1);
    expect(countNavForms(forms, { workspaceId: 'b' })).toBe(1);
    expect(countNavForms(forms, { workspaceId: 'missing' })).toBe(0);
  });

  it('syncWorkspaceCounts zeros stale persisted counts', () => {
    const workspaces = [
      { id: 'a', label: 'A', color: '#000', count: 99 },
      { id: 'b', label: 'B', color: '#111', count: 1 },
    ];
    const synced = syncWorkspaceCounts(workspaces, []);
    expect(synced.map((w) => w.count)).toEqual([0, 0]);
  });
});

import { readJson, writeJson, removeKey } from '@/utils/localStorageSafe';

const WORKSPACES_KEY = 'clearform_workspaces';

export const readWorkspaces = () => {
  const stored = readJson(WORKSPACES_KEY, null);
  return Array.isArray(stored) && stored.length > 0 ? stored : null;
};

export const writeWorkspaces = (workspaces) => {
  writeJson(WORKSPACES_KEY, workspaces);
};

export const clearWorkspaces = () => {
  removeKey(WORKSPACES_KEY);
};

/** Forms included in sidebar / workspace badges based on current active filter. */
export const countNavForms = (forms, { workspaceId, activeFilter = 'all' } = {}) =>
  forms.filter((f) => {
    // 1. Check if form matches the current filter tab
    const matchesFilter = activeFilter === 'archived'
      ? f.status === 'archived'
      : activeFilter === 'trash'
        ? f.status === 'trash'
        : (activeFilter === 'all' || f.status === activeFilter) && f.status !== 'archived' && f.status !== 'trash';
    if (!matchesFilter) return false;

    // 2. Check if form matches the workspace
    if (workspaceId != null && workspaceId !== 'all') {
      const fw = f.workspace == null || f.workspace === '' ? '' : String(f.workspace);
      return fw === String(workspaceId);
    }
    return true;
  }).length;

/** Recompute per-workspace form counts from the current forms list. */
export const syncWorkspaceCounts = (workspaces, forms, activeFilter = 'all') =>
  workspaces.map((ws) => ({
    ...ws,
    count: countNavForms(forms, { workspaceId: ws.id, activeFilter }),
  }));

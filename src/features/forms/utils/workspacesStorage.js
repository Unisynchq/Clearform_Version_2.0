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

/** Recompute per-workspace form counts from the current forms list. */
export const syncWorkspaceCounts = (workspaces, forms) =>
  workspaces.map((ws) => ({
    ...ws,
    count: forms.filter((f) => f.workspace === ws.id).length,
  }));

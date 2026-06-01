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

/** Forms included in sidebar / workspace badges (archived forms are excluded). */
export const countNavForms = (forms, { workspaceId } = {}) =>
  forms.filter((f) => {
    if (f.status === 'archived') return false;
    if (workspaceId != null && workspaceId !== 'all') {
      const fw = f.workspace == null || f.workspace === '' ? '' : String(f.workspace);
      return fw === String(workspaceId);
    }
    return true;
  }).length;

/** Recompute per-workspace form counts from the current forms list. */
export const syncWorkspaceCounts = (workspaces, forms) =>
  workspaces.map((ws) => ({
    ...ws,
    count: countNavForms(forms, { workspaceId: ws.id }),
  }));

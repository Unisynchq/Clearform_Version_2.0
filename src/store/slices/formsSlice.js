import { createSlice, createSelector } from '@reduxjs/toolkit';
import { readPersistedForms, clearUserForms } from '@/features/forms/utils/userFormsStorage';
import { listForms, patchForm, getForm, getTrashForms } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';

import { listWorkspaces } from '@/api/services/workspacesService';
import {
  readAllFormResponses,
  clearFormResponses,
} from '@/features/forms/utils/formResponsesStorage';
import {
  readWorkspaces,
  clearWorkspaces,
  syncWorkspaceCounts,
  countNavForms,
} from '@/features/forms/utils/workspacesStorage';
import { readFormsUi } from '@/features/forms/utils/formsUiStorage';
import { normalizeApiForms, normalizeApiForm } from '@/utils/normalizeApiForm';

// Convert a "Xm/Xh/Xd/Xw ago" string to milliseconds so we can sort by recency
function timeAgoToMs(timeAgo) {
  if (!timeAgo) return 0;
  const m = timeAgo.match(/^(\d+)([mhdw])/);
  if (!m) return 0;
  const n = parseInt(m[1]);
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return n * (multipliers[m[2]] ?? 0);
}

const savedUi = readFormsUi();
const apiMode = isApiConfigured();
const bootstrapWorkspaces = apiMode ? [] : (readWorkspaces() ?? []);
const bootstrapResponses = apiMode ? {} : readAllFormResponses();
const bootstrapForms = apiMode
  ? []
  : readPersistedForms().map((form) => ({
      ...form,
      responses: (bootstrapResponses[String(form.id)] ?? []).length,
    }));

const initialActiveWorkspace =
  savedUi.activeWorkspace !== 'all' &&
  !bootstrapWorkspaces.some((w) => w.id === savedUi.activeWorkspace)
    ? 'all'
    : savedUi.activeWorkspace;

const initialState = {
  forms: bootstrapForms,
  workspaces: syncWorkspaceCounts(bootstrapWorkspaces, bootstrapForms),
  activeFilter: savedUi.activeFilter,
  activeWorkspace: initialActiveWorkspace,
  searchQuery: savedUi.searchQuery,
  showTemplateBanner: savedUi.showTemplateBanner,
  viewMode: savedUi.viewMode,
  sortOrder: savedUi.sortOrder,
  isLoading: false,
  error: null,
  advancedFilters: savedUi.advancedFilters ?? { status: [], responses: [] },
  responsesByFormId: bootstrapResponses,
};

const applyWorkspaceCounts = (state) => {
  state.workspaces = syncWorkspaceCounts(state.workspaces, state.forms);
};

const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    setActiveFilter(state, action) {
      state.activeFilter = action.payload;
    },
    setActiveWorkspace(state, action) {
      state.activeWorkspace = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    dismissTemplateBanner(state) {
      state.showTemplateBanner = false;
    },
    setViewMode(state, action) {
      state.viewMode = action.payload;
    },
    setSortOrder(state, action) {
      state.sortOrder = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    addForm(state, action) {
      state.forms.unshift(action.payload);
      applyWorkspaceCounts(state);
    },
    updateForm(state, action) {
      const { id, changes } = action.payload;
      const form = state.forms.find((f) => f.id === id);
      if (form) Object.assign(form, normalizeApiForm({ ...form, ...changes }));
      applyWorkspaceCounts(state);
    },
    /** @deprecated kept for offline (non-API) mode only */
    setFormPause(state, action) {
      const { formId, endLabel, endTimestamp, pauseType, viewYear, viewMonth, selDay, hour, minute, ampm } = action.payload;
      const form = state.forms.find((f) => f.id === formId);
      if (form) {
        form.isPaused = true;
        form.pauseSettings = { confirmed: true, endLabel, endTimestamp: endTimestamp ?? null, pauseType, viewYear, viewMonth, selDay, hour, minute, ampm };
      }
    },
    /** @deprecated kept for offline (non-API) mode only */
    clearFormPause(state, action) {
      const form = state.forms.find((f) => f.id === action.payload);
      if (form) {
        form.isPaused = false;
        form.pauseSettings = null;
      }
    },
    addWorkspace(state, action) {
      const { id, label, color } = action.payload;
      state.workspaces.push({ id, label, color, count: 0 });
      state.activeWorkspace = id;
    },
    renameWorkspace(state, action) {
      const { workspaceId, newName, color } = action.payload;
      const ws = state.workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        if (newName) ws.label = newName;
        if (color) ws.color = color;
      }
    },
    deleteWorkspace(state, action) {
      const workspaceId = action.payload;
      state.workspaces = state.workspaces.filter((w) => w.id !== workspaceId);
      state.forms.forEach((form) => {
        if (form.workspace === workspaceId) {
          form.workspace = null;
        }
      });
      applyWorkspaceCounts(state);
      if (state.activeWorkspace === workspaceId) state.activeWorkspace = 'all';
    },
    deleteForm(state, action) {
      const formId = action.payload;
      state.forms = state.forms.filter((f) => f.id !== formId);
      delete state.responsesByFormId[String(formId)];
      applyWorkspaceCounts(state);
    },
    addFormResponse(state, action) {
      const response = action.payload;
      const key = String(response.formId);
      if (!state.responsesByFormId[key]) {
        state.responsesByFormId[key] = [];
      }
      state.responsesByFormId[key].unshift(response);
      const form = state.forms.find((f) => String(f.id) === String(response.formId));
      if (form) {
        form.responses = (form.responses ?? 0) + 1;
        form.timeAgo = 'just now';
      }
    },
    archiveForm(state, action) {
      const form = state.forms.find((f) => f.id === action.payload);
      if (form) form.status = 'archived';
    },
    unarchiveForm(state, action) {
      const form = state.forms.find((f) => f.id === action.payload);
      if (form) form.status = 'draft';
    },
    setAdvancedFilters(state, action) {
      state.advancedFilters = action.payload;
    },
    clearAdvancedFilters(state) {
      state.advancedFilters = { status: [], responses: [] };
    },
    /** Reset dashboard list filters (status tab, workspace, search, advanced filters). */
    clearAllFormFilters(state) {
      state.activeFilter = 'all';
      state.activeWorkspace = 'all';
      state.searchQuery = '';
      state.advancedFilters = { status: [], responses: [] };
    },
    setForms(state, action) {
      state.forms = normalizeApiForms(action.payload);
      applyWorkspaceCounts(state);
    },
    setWorkspaces(state, action) {
      state.workspaces = syncWorkspaceCounts(action.payload, state.forms);
      if (
        state.activeWorkspace !== 'all' &&
        !state.workspaces.some((w) => w.id === state.activeWorkspace)
      ) {
        state.activeWorkspace = 'all';
      }
    },
    resetFormsForOnboarding(state) {
      state.forms = [];
      state.workspaces = [];
      state.responsesByFormId = {};
      state.showTemplateBanner = true;
      state.activeFilter = 'all';
      state.activeWorkspace = 'all';
      state.searchQuery = '';
      state.isLoading = false;
      state.error = null;
      clearUserForms();
      clearWorkspaces();
      clearFormResponses();
    },
    resetFormsState(state) {
      state.forms = [];
      state.workspaces = [];
      state.responsesByFormId = {};
      state.isLoading = false;
      state.error = null;
      clearUserForms();
      clearWorkspaces();
      clearFormResponses();
    },
  },
});

export const {
  setForms,
  setWorkspaces,
  setActiveFilter,
  setActiveWorkspace,
  setSearchQuery,
  dismissTemplateBanner,
  setViewMode,
  setSortOrder,
  setLoading,
  setError,
  addForm,
  updateForm,
  setFormPause,
  clearFormPause,
  addWorkspace,
  renameWorkspace,
  deleteWorkspace,
  deleteForm,
  addFormResponse,
  archiveForm,
  unarchiveForm,
  setAdvancedFilters,
  clearAdvancedFilters,
  clearAllFormFilters,
  resetFormsForOnboarding,
  resetFormsState,
} = formsSlice.actions;

/** Assign a form to a workspace (or remove from all workspaces). */
export const assignFormToWorkspace = ({ formId, workspaceId }) => async (dispatch) => {
  const normalized = workspaceId ? String(workspaceId) : '';
  if (isApiConfigured()) {
    try {
      const updated = await patchForm(formId, { workspaceId: normalized || null });
      if (updated?.id) {
        dispatch(updateForm({ id: formId, changes: normalizeApiForm(updated) }));
        return;
      }
    } catch (err) {
      console.error('[forms] backend workspace assign failed', err);
    }
  }
  dispatch(updateForm({ id: formId, changes: { workspace: normalized, workspaceId: normalized } }));
};

/**
 * Pause a form — updates DB via API and re-fetches the form to sync Redux.
 * The `pausePayload` is stored for UI display (pause type, end time, etc.)
 * but `isPaused` truth lives in the database.
 */
export const pauseFormOnServer = (formId, pausePayload) => async (dispatch) => {
  if (isApiConfigured()) {
    try {
      // Use the dedicated /pause endpoint (sets isPaused + pausedAt in DB)
      const updated = await patchForm(formId, { isPaused: true });
      if (updated?.id) {
        // Merge pause UI payload into the fresh DB data
        dispatch(updateForm({
          id: formId,
          changes: {
            ...normalizeApiForm(updated),
            isPaused: true,
            pauseSettings: { confirmed: true, ...pausePayload },
          },
        }));
        return;
      }
    } catch (err) {
      console.error('[forms] backend pause failed', err);
    }
    // If PATCH returned nothing usable, optimistically update then re-fetch
    dispatch(setFormPause({ formId, ...pausePayload }));
    try {
      const fresh = await getForm(formId);
      if (fresh?.id) dispatch(updateForm({ id: formId, changes: normalizeApiForm(fresh) }));
    } catch (_) {}
    return;
  }
  // Offline mode: apply locally only
  dispatch(setFormPause({ formId, ...pausePayload }));
};

/**
 * Archive a form — updates DB and re-fetches to confirm status.
 */
export const archiveFormOnServer = (formId) => async (dispatch) => {
  if (isApiConfigured()) {
    try {
      const updated = await patchForm(formId, { status: 'ARCHIVED' });
      if (updated?.id) {
        dispatch(updateForm({ id: formId, changes: normalizeApiForm(updated) }));
        return;
      }
    } catch (err) {
      console.error('[forms] backend archive failed', err);
    }
  }
  dispatch(archiveForm(formId));
};

/**
 * Unarchive a form — updates DB and re-fetches to confirm status.
 */
export const unarchiveFormOnServer = (formId) => async (dispatch) => {
  if (isApiConfigured()) {
    try {
      const updated = await patchForm(formId, { status: 'DRAFT' });
      if (updated?.id) {
        dispatch(updateForm({ id: formId, changes: normalizeApiForm(updated) }));
        return;
      }
    } catch (err) {
      console.error('[forms] backend unarchive failed', err);
    }
  }
  dispatch(unarchiveForm(formId));
};

/**
 * Restore a form from the trash — updates DB and re-fetches to confirm status.
 */
export const restoreFormOnServer = (formId) => async (dispatch) => {
  if (isApiConfigured()) {
    try {
      const { restoreFormRequest } = await import('@/components/analytics/analyticsFormActions');
      const updated = await restoreFormRequest({ formId });
      if (updated?.id) {
        dispatch(updateForm({ id: formId, changes: normalizeApiForm(updated) }));
        dispatch(loadFormsFromApi()); // Refresh to ensure tabs are updated
        return;
      }
    } catch (err) {
      console.error('[forms] backend restore failed', err);
    }
  }
  // Offline fallback (just unarchive logic to move back to drafts)
  dispatch(unarchiveForm(formId));
};

/**
 * Resume a form — updates DB via API and re-fetches the form to sync Redux.
 */
export const resumeFormOnServer = (formId) => async (dispatch) => {
  if (isApiConfigured()) {
    try {
      const updated = await patchForm(formId, { isPaused: false });
      if (updated?.id) {
        dispatch(updateForm({
          id: formId,
          changes: {
            ...normalizeApiForm(updated),
            isPaused: false,
            pauseSettings: null,
          },
        }));
        return;
      }
    } catch (err) {
      console.error('[forms] backend resume failed', err);
    }
    // Optimistic fallback
    dispatch(clearFormPause(formId));
    try {
      const fresh = await getForm(formId);
      if (fresh?.id) dispatch(updateForm({ id: formId, changes: normalizeApiForm(fresh) }));
    } catch (_) {}
    return;
  }
  // Offline mode
  dispatch(clearFormPause(formId));
};

/**
 * Load all forms from the API (active + archived + trash), deduplicating by ID.
 * Falls back to localStorage when API not configured.
 * Database is the single source of truth — no localStorage merge for business data.
 */
export const loadFormsFromApi = () => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const [forms, archivedForms, trashForms] = await Promise.all([
      listForms(),
      listForms('archived').catch(() => []),
      getTrashForms().catch(() => []),
    ]);
    // Deduplicate by form id — DB data is authoritative, no localStorage merge
    const map = new Map();
    [...(Array.isArray(forms) ? forms : []),
     ...(Array.isArray(archivedForms) ? archivedForms : []),
     ...(Array.isArray(trashForms) ? trashForms : [])].forEach((f) => {
       if (f?.id) map.set(String(f.id), f);
     });
    dispatch(setForms(Array.from(map.values())));
  } catch (err) {
    const msg = err?.message || 'Failed to load forms from server';
    dispatch(setError(msg));
  } finally {
    dispatch(setLoading(false));
  }
};

/** Load workspaces from the API (falls back to localStorage when API not configured). */
export const loadWorkspacesFromApi = () => async (dispatch) => {
  try {
    const workspaces = await listWorkspaces();
    if (Array.isArray(workspaces)) dispatch(setWorkspaces(workspaces));
  } catch (err) {
    const msg = err?.message || 'Failed to load workspaces from server';
    dispatch(setError(msg));
  }
};

// Memoized with createSelector so the result is only recomputed when one of
// its inputs actually changes. Previously this returned a fresh array on every
// dispatch (including unrelated toast/modal dispatches), which caused every
// consumer of useSelector(selectFilteredForms) to re-render needlessly.
const selectFormsRaw         = (state) => state.forms.forms;
const selectWorkspacesRaw    = (state) => state.forms.workspaces;
const selectActiveFilter     = (state) => state.forms.activeFilter;
const selectActiveWorkspace  = (state) => state.forms.activeWorkspace;
const selectSearchQuery      = (state) => state.forms.searchQuery;
const selectSortOrder        = (state) => state.forms.sortOrder;
const selectAdvancedFilters  = (state) => state.forms.advancedFilters;
const selectResponsesByFormId = (state) => state.forms.responsesByFormId;

/** Workspaces with form counts derived from the live forms list (sidebar, chips). */
export const selectNavWorkspaces = createSelector(
  [selectWorkspacesRaw, selectFormsRaw, selectActiveFilter],
  (workspaces, forms, activeFilter) => syncWorkspaceCounts(workspaces, forms, activeFilter),
);

/** Total non-archived forms — matches what users see under "All forms". */
export const selectTotalFormCount = createSelector([selectFormsRaw], (forms) =>
  countNavForms(forms),
);

/** Stored responses for a form (newest first). */
export const selectFormResponses = createSelector(
  [selectResponsesByFormId, (_state, formId) => formId],
  (byFormId, formId) => {
    if (formId == null) return [];
    const list = byFormId[String(formId)];
    return Array.isArray(list) ? list : [];
  },
);

export const selectFilteredForms = createSelector(
  [
    selectFormsRaw,
    selectActiveFilter,
    selectActiveWorkspace,
    selectSearchQuery,
    selectSortOrder,
    selectAdvancedFilters,
  ],
  (forms, activeFilter, activeWorkspace, searchQuery, sortOrder, advancedFilters) => {
    let filtered = forms.filter((form) => {
      const matchesFilter = activeFilter === 'archived'
        ? form.status === 'archived'
        : activeFilter === 'trash'
          ? form.status === 'trash'
          : (activeFilter === 'all' || form.status === activeFilter) && form.status !== 'archived' && form.status !== 'trash';
      const formWorkspace = form.workspace == null || form.workspace === '' ? '' : String(form.workspace);
      const matchesWorkspace =
        activeWorkspace === 'all' ||
        formWorkspace === String(activeWorkspace) ||
        String(form.workspaceId ?? '') === String(activeWorkspace);
      const matchesSearch =
        !searchQuery ||
        form.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesWorkspace && matchesSearch;
    });

    if (advancedFilters.status.length > 0) {
      filtered = filtered.filter((f) => advancedFilters.status.includes(f.status));
    }

    if (advancedFilters.responses.length === 1) {
      if (advancedFilters.responses[0] === 'has_responses') {
        filtered = filtered.filter((f) => f.responses > 0);
      } else if (advancedFilters.responses[0] === 'no_responses') {
        filtered = filtered.filter((f) => f.responses === 0);
      }
    }

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          // "ago" values: bigger = older. Oldest first → descending.
          return timeAgoToMs(b.timeAgo) - timeAgoToMs(a.timeAgo);
        case 'most_responses':
          return b.responses - a.responses;
        case 'fewest_responses':
          return a.responses - b.responses;
        case 'name_az':
          return a.title.localeCompare(b.title);
        case 'name_za':
          return b.title.localeCompare(a.title);
        case 'recent':
        default:
          // Smallest "ago" = most recent → ascending.
          return timeAgoToMs(a.timeAgo) - timeAgoToMs(b.timeAgo);
      }
    });
  }
);

export default formsSlice.reducer;

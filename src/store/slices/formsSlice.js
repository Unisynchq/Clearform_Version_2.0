import { createSlice, createSelector } from '@reduxjs/toolkit';
import { readPersistedForms, clearUserForms } from '@/features/forms/utils/userFormsStorage';
import { listForms, patchForm } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { NO_WORKSPACE_ID } from '@/features/forms/constants/workspaces';
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
    setFormPause(state, action) {
      const { formId, endLabel, endTimestamp, pauseType, viewYear, viewMonth, selDay, hour, minute, ampm } = action.payload;
      const form = state.forms.find((f) => f.id === formId);
      if (form) {
        form.pauseSettings = { confirmed: true, endLabel, endTimestamp: endTimestamp ?? null, pauseType, viewYear, viewMonth, selDay, hour, minute, ampm };
      }
    },
    clearFormPause(state, action) {
      const form = state.forms.find((f) => f.id === action.payload);
      if (form) {
        form.pauseSettings = null;
      }
    },
    addWorkspace(state, action) {
      const { id, label, color } = action.payload;
      state.workspaces.push({ id, label, color, count: 0 });
      state.activeWorkspace = id;
    },
    renameWorkspace(state, action) {
      const { workspaceId, newName } = action.payload;
      const ws = state.workspaces.find((w) => w.id === workspaceId);
      if (ws) ws.label = newName;
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
      if (form) form.status = 'live';
    },
    setAdvancedFilters(state, action) {
      state.advancedFilters = action.payload;
    },
    clearAdvancedFilters(state) {
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
  resetFormsForOnboarding,
} = formsSlice.actions;

/** Assign a form to a workspace (or remove from all workspaces). */
export const assignFormToWorkspace = ({ formId, workspaceId }) => async (dispatch) => {
  const normalized =
    workspaceId && workspaceId !== NO_WORKSPACE_ID ? String(workspaceId) : '';
  if (isApiConfigured()) {
    await patchForm(formId, { workspaceId: normalized || null });
  }
  dispatch(
    updateForm({
      id: formId,
      changes: { workspace: normalized },
    }),
  );
};

/** Load forms from the API (falls back to localStorage when API not configured). */
export const loadFormsFromApi = () => async (dispatch) => {
  try {
    const forms = await listForms();
    if (Array.isArray(forms)) dispatch(setForms(forms));
  } catch {
    // silently keep the localStorage bootstrap already in state
  }
};

/** Load workspaces from the API (falls back to localStorage when API not configured). */
export const loadWorkspacesFromApi = () => async (dispatch) => {
  try {
    const workspaces = await listWorkspaces();
    if (Array.isArray(workspaces)) dispatch(setWorkspaces(workspaces));
  } catch {
    // keep localStorage bootstrap already in state
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
  [selectWorkspacesRaw, selectFormsRaw],
  (workspaces, forms) => syncWorkspaceCounts(workspaces, forms),
);

/** Total non-archived forms — matches what users see under “All forms”. */
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
        : (activeFilter === 'all' || form.status === activeFilter) && form.status !== 'archived';
      const formWorkspace = form.workspace == null || form.workspace === '' ? '' : String(form.workspace);
      const matchesWorkspace =
        activeWorkspace === 'all' || formWorkspace === String(activeWorkspace);
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

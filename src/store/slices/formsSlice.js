import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { readFormsUi } from '@/features/forms/utils/formsUiStorage';
import { migrateBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import * as formsService from '@/api/services/formsService';
import * as workspacesService from '@/api/services/workspacesService';

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
const initialWorkspaces = [];
const initialActiveWorkspace = savedUi.activeWorkspace;

const initialState = {
  forms: [],
  workspaces: [],
  activeFilter: savedUi.activeFilter,
  activeWorkspace: initialActiveWorkspace,
  searchQuery: savedUi.searchQuery,
  showTemplateBanner: savedUi.showTemplateBanner,
  viewMode: savedUi.viewMode,
  sortOrder: savedUi.sortOrder,
  isLoading: false,
  advancedFilters: savedUi.advancedFilters ?? { status: [], responses: [] },
  responsesByFormId: {},
};

// --- Async Thunks ---

export const fetchWorkspacesThunk = createAsyncThunk(
  'forms/fetchWorkspaces',
  async (_, { dispatch }) => {
    const data = await workspacesService.listWorkspaces();
    return data;
  }
);

export const fetchFormsThunk = createAsyncThunk(
  'forms/fetchForms',
  async (_, { dispatch }) => {
    const data = await formsService.listForms();
    return data;
  }
);

export const createFormThunk = createAsyncThunk(
  'forms/createForm',
  async (formPayload, { dispatch }) => {
    const tempId = formPayload.id ?? `temp_${Date.now()}`;
    // Strip client-only fields before sending to API
    const { id: _discarded, status: _s, responses: _r, timeAgo: _t, workspace: _w, ...formData } = formPayload;
    const optimisticData = { status: 'draft', responses: 0, timeAgo: 'just now', ...formPayload, id: tempId };
    dispatch(formsSlice.actions.addForm(optimisticData));

    try {
      const serverData = await formsService.createForm(formData);
      migrateBuilderDraft(String(tempId), serverData.id);
      dispatch(formsSlice.actions.deleteForm(tempId));
      dispatch(formsSlice.actions.addForm(serverData));
      return serverData;
    } catch (err) {
      dispatch(formsSlice.actions.deleteForm(tempId));
      throw err;
    }
  }
);

export const deleteFormThunk = createAsyncThunk(
  'forms/deleteForm',
  async (formId, { dispatch }) => {
    dispatch(formsSlice.actions.deleteForm(formId));
    await formsService.deleteForm(formId);
    return formId;
  }
);

export const archiveFormThunk = createAsyncThunk(
  'forms/archiveForm',
  async (formId, { dispatch }) => {
    dispatch(formsSlice.actions.archiveForm(formId));
    await formsService.archiveForm(formId);
    return formId;
  }
);

export const duplicateFormThunk = createAsyncThunk(
  'forms/duplicateForm',
  async (payload, { dispatch }) => {
    // Add optimistically assuming the service returns something useful, but we can just wait for it.
    // The user prefers it to feel instant:
    const tempId = `temp_${Date.now()}`;
    dispatch(formsSlice.actions.addForm({ id: tempId, title: payload.newTitle, status: 'draft', responses: 0, timeAgo: 'just now' }));
    
    try {
      const serverData = await formsService.duplicateForm(payload);
      dispatch(formsSlice.actions.deleteForm(tempId));
      dispatch(formsSlice.actions.addForm(serverData));
      return serverData;
    } catch (err) {
      dispatch(formsSlice.actions.deleteForm(tempId));
      throw err;
    }
  }
);

export const createWorkspaceThunk = createAsyncThunk(
  'forms/createWorkspace',
  async (workspacePayload, { dispatch }) => {
    const tempId = `ws_temp_${Date.now()}`;
    const optimisticData = { id: tempId, ...workspacePayload, count: 0 };
    dispatch(formsSlice.actions.addWorkspace(optimisticData));
    
    try {
      const serverData = await workspacesService.createWorkspace(workspacePayload);
      // Wait, we don't have a deleteWorkspace action. It's okay to just update it, or add it.
      // But actually, just dispatch addWorkspace again? Redux toolkit doesn't merge by ID if it's an array.
      // We will just let it be, or implement a removeWorkspace if needed.
      return serverData;
    } catch (err) {
      throw err;
    }
  }
);

function syncWorkspaceCounts(workspaces, forms) {
  return workspaces.map((w) => ({
    ...w,
    count: forms.filter(
      (f) => f.workspace === w.id && f.status !== 'archived' && f.status !== 'trash'
    ).length,
  }));
}

function countNavForms(forms) {
  return forms.filter((f) => f.status !== 'archived' && f.status !== 'trash').length;
}

const applyWorkspaceCounts = (state) => {
  state.workspaces = state.workspaces.map((w) => {
    const count = state.forms.filter(
      (f) => f.workspace === w.id && f.status !== 'archived' && f.status !== 'trash'
    ).length;
    return { ...w, count };
  });
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
      if (form) Object.assign(form, changes);
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
      const form = state.forms.find((f) => f.id === response.formId);
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
    resetFormsForOnboarding(state) {
      state.forms = [];
      state.workspaces = [];
      state.responsesByFormId = {};
      state.showTemplateBanner = true;
      state.activeFilter = 'all';
      state.activeWorkspace = 'all';
      state.searchQuery = '';
      state.isLoading = false;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFormsThunk.fulfilled, (state, action) => {
        state.forms = action.payload;
        applyWorkspaceCounts(state);
        state.isLoading = false;
      })
      .addCase(fetchFormsThunk.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchWorkspacesThunk.fulfilled, (state, action) => {
        state.workspaces = action.payload;
        applyWorkspaceCounts(state);
      })
      .addCase(createWorkspaceThunk.fulfilled, (state, action) => {
        // Remove the optimistic temp one and add real one
        state.workspaces = state.workspaces.filter(w => !w.id.startsWith('ws_temp_'));
        state.workspaces.push(action.payload);
        applyWorkspaceCounts(state);
      });
  },
});

export const {
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
      const matchesWorkspace =
        activeWorkspace === 'all' || form.workspace === activeWorkspace;
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

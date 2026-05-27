import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchWorkspaces = createAsyncThunk(
  'forms/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/workspaces');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspaces');
    }
  }
);

export const fetchForms = createAsyncThunk(
  'forms/fetchForms',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/forms', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch forms');
    }
  }
);

export const searchFormsThunk = createAsyncThunk(
  'forms/searchForms',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get('/forms', { params: { search: query } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search forms');
    }
  }
);

export const fetchAnalyticsThunk = createAsyncThunk(
  'forms/fetchAnalytics',
  async (formId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/forms/${formId}/analytics`);
      return { formId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchResponsesThunk = createAsyncThunk(
  'forms/fetchResponses',
  async (formId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/forms/${formId}/responses`);
      return { formId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch responses');
    }
  }
);

export const createFormThunk = createAsyncThunk(
  'forms/createForm',
  async ({ title, workspaceId = null }, { rejectWithValue }) => {
    try {
      const response = await api.post('/forms', { title, workspaceId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create form');
    }
  }
);

export const deleteFormThunk = createAsyncThunk(
  'forms/deleteForm',
  async (formId, { rejectWithValue }) => {
    try {
      await api.delete(`/forms/${formId}`);
      return formId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete form');
    }
  }
);

export const archiveFormThunk = createAsyncThunk(
  'forms/archiveForm',
  async (formId, { rejectWithValue }) => {
    try {
      await api.patch(`/forms/${formId}/archive`);
      return formId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to archive form');
    }
  }
);

export const duplicateFormThunk = createAsyncThunk(
  'forms/duplicateForm',
  async ({ formId, copyName }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/forms/${formId}/duplicate`, { title: copyName });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to duplicate form');
    }
  }
);

export const pauseFormThunk = createAsyncThunk(
  'forms/pauseForm',
  async ({ formId, pauseSettings }, { rejectWithValue }) => {
    try {
      await api.post(`/forms/${formId}/pause`);
      return { formId, pauseSettings };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pause form');
    }
  }
);

export const unpauseFormThunk = createAsyncThunk(
  'forms/unpauseForm',
  async (formId, { rejectWithValue }) => {
    try {
      await api.delete(`/forms/${formId}/pause`);
      return formId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unpause form');
    }
  }
);

const initialState = {
  forms: [],
  workspaces: [],
  activeFilter: 'all',
  activeWorkspace: 'all',
  searchQuery: '',
  showTemplateBanner: true,
  viewMode: 'grid', // 'grid' | 'list'
  isLoading: true,
  error: null,
  searchResults: [],
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
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    addForm(state, action) {
      state.forms.unshift(action.payload);
    },
    setFormPause(state, action) {
      const { formId, endLabel, viewYear, viewMonth, selDay } = action.payload;
      const form = state.forms.find((f) => f.id === formId);
      if (form) {
        form.pauseSettings = { confirmed: true, endLabel, viewYear, viewMonth, selDay };
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
    deleteForm(state, action) {
      state.forms = state.forms.filter((f) => f.id !== action.payload);
    },
    archiveForm(state, action) {
      const form = state.forms.find((f) => f.id === action.payload);
      if (form) form.status = 'archived';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.workspaces = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchForms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forms = action.payload;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteFormThunk.fulfilled, (state, action) => {
        state.forms = state.forms.filter((f) => f.id !== action.payload);
      })
      .addCase(archiveFormThunk.fulfilled, (state, action) => {
        const form = state.forms.find((f) => f.id === action.payload);
        if (form) form.status = 'archived';
      })
      .addCase(duplicateFormThunk.fulfilled, (state, action) => {
        state.forms.unshift(action.payload);
      })
      .addCase(pauseFormThunk.fulfilled, (state, action) => {
        const form = state.forms.find((f) => f.id === action.payload.formId);
        if (form) form.pauseSettings = action.payload.pauseSettings;
      })
      .addCase(unpauseFormThunk.fulfilled, (state, action) => {
        const form = state.forms.find((f) => f.id === action.payload);
        if (form) form.pauseSettings = null;
      })
      .addCase(searchFormsThunk.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(fetchAnalyticsThunk.fulfilled, (state, action) => {
        const form = state.forms.find((f) => f.id === action.payload.formId);
        if (form) form.analytics = action.payload.data;
      })
      .addCase(createFormThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createFormThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forms.unshift(action.payload);
      })
      .addCase(createFormThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveFilter,
  setActiveWorkspace,
  setSearchQuery,
  dismissTemplateBanner,
  setViewMode,
  setLoading,
  addForm,
  setFormPause,
  clearFormPause,
  addWorkspace,
  deleteForm,
  archiveForm,
} = formsSlice.actions;

export const selectFilteredForms = (state) => {
  const { forms, activeFilter, activeWorkspace, searchQuery } = state.forms;
  return forms.filter((form) => {
    const matchesFilter =
      activeFilter === 'all' || form.status === activeFilter;
    const matchesWorkspace =
      activeWorkspace === 'all' || form.workspace === activeWorkspace;
    const matchesSearch =
      !searchQuery ||
      form.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesWorkspace && matchesSearch;
  });
};

export default formsSlice.reducer;

import { isApiConfigured } from '@/config/env';
import { writeUserForms } from '@/features/forms/utils/userFormsStorage';
import { writeAllFormResponses } from '@/features/forms/utils/formResponsesStorage';
import { writeWorkspaces, syncWorkspaceCounts } from '@/features/forms/utils/workspacesStorage';
import { writeFormsUi } from '@/features/forms/utils/formsUiStorage';

const FORMS_ACTIONS = new Set([
  'forms/addForm',
  'forms/updateForm',
  'forms/deleteForm',
  'forms/addFormResponse',
  'forms/archiveForm',
  'forms/unarchiveForm',
  'forms/setFormPause',
  'forms/clearFormPause',
  'forms/addWorkspace',
  'forms/renameWorkspace',
  'forms/deleteWorkspace',
  'forms/resetFormsForOnboarding',
  'onboarding/completeOnboarding',
]);

const UI_ACTIONS = new Set([
  'forms/setActiveFilter',
  'forms/setActiveWorkspace',
  'forms/setSearchQuery',
  'forms/dismissTemplateBanner',
  'forms/setViewMode',
  'forms/setSortOrder',
  'forms/setAdvancedFilters',
  'forms/clearAdvancedFilters',
  'forms/clearAllFormFilters',
]);

const persistFormsSlice = (formsState) => {
  const apiMode = isApiConfigured();

  if (!apiMode) {
    // Offline mode: write all business data to localStorage as single source of truth
    writeUserForms(formsState.forms);
    writeAllFormResponses(formsState.responsesByFormId ?? {});
    writeWorkspaces(syncWorkspaceCounts(formsState.workspaces, formsState.forms));
  }
  // NOTE: When API is configured, the database is the source of truth for all
  // business data (forms, responses, workspaces, pause state). We do NOT write
  // business data to localStorage in API mode to avoid stale data overriding
  // fresh DB data on next load.

  // Always persist UI preferences (filter, sort, view mode, search, workspace
  // selection) — these are not business data and do not affect correctness.
  writeFormsUi({
    activeFilter: formsState.activeFilter,
    activeWorkspace: formsState.activeWorkspace,
    searchQuery: formsState.searchQuery,
    showTemplateBanner: formsState.showTemplateBanner,
    viewMode: formsState.viewMode,
    sortOrder: formsState.sortOrder,
    advancedFilters: formsState.advancedFilters,
  });
};

/** Persist dashboard UI preferences to localStorage.
 *  In API mode, business data (forms, responses, workspaces, pause state)
 *  is NOT written — the database is the single source of truth. */
export const persistAppMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (FORMS_ACTIONS.has(action.type) || UI_ACTIONS.has(action.type)) {
    persistFormsSlice(store.getState().forms);
  }
  return result;
};

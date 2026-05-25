import { writeUserForms } from '@/features/forms/utils/userFormsStorage';
import { writeWorkspaces, syncWorkspaceCounts } from '@/features/forms/utils/workspacesStorage';
import { writeFormsUi } from '@/features/forms/utils/formsUiStorage';

const FORMS_ACTIONS = new Set([
  'forms/addForm',
  'forms/updateForm',
  'forms/deleteForm',
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
]);

const persistFormsSlice = (formsState) => {
  writeUserForms(formsState.forms);
  writeWorkspaces(syncWorkspaceCounts(formsState.workspaces, formsState.forms));
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

/** Persist forms, workspaces, and dashboard UI preferences to localStorage. */
export const persistAppMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (FORMS_ACTIONS.has(action.type) || UI_ACTIONS.has(action.type)) {
    persistFormsSlice(store.getState().forms);
  }
  return result;
};

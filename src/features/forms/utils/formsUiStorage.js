import { readJson, writeJson, removeKey } from '@/utils/localStorageSafe';

const FORMS_UI_KEY = 'clearform_forms_ui';

const DEFAULTS = {
  activeFilter: 'all',
  activeWorkspace: 'all',
  searchQuery: '',
  showTemplateBanner: true,
  viewMode: 'grid',
  sortOrder: 'recent',
  advancedFilters: { status: [], responses: [] },
};

export const readFormsUi = () => {
  const saved = readJson(FORMS_UI_KEY, {});
  // Tab id was "drafts"; form status is "draft"
  const activeFilter = saved.activeFilter === 'drafts' ? 'draft' : saved.activeFilter;
  return { ...DEFAULTS, ...saved, activeFilter };
};

export const writeFormsUi = (ui) => {
  writeJson(FORMS_UI_KEY, ui);
};

export const clearFormsUi = () => {
  removeKey(FORMS_UI_KEY);
};

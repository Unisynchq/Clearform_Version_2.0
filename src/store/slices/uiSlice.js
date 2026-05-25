import { createSlice } from '@reduxjs/toolkit';
import { MAX_COMPARE_FORMS } from '@/constants';

const initialState = {
  contextMenu: {
    open: false,
    formId: null,
    x: 0,
    y: 0,
  },
  deleteModal: {
    open: false,
    formId: null,
    formTitle: '',
  },
  duplicateModal: {
    open: false,
    formId: null,
    formTitle: '',
  },
  archiveModal: {
    open: false,
    formId: null,
    formTitle: '',
    responses: 0,
  },
  pauseModal: {
    open: false,
    formId: null,
    formTitle: '',
  },
  formOverlay: {
    open: false,
    formId: null,
  },
  searchPalette: {
    open: false,
  },
  createWorkspaceModal: {
    open: false,
  },
  createNewFormModal: {
    open: false,
  },
  shareModal: {
    open: false,
    formId: null,
    formTitle: '',
  },
  workspaceContextMenu: {
    open: false,
    workspaceId: null,
    x: 0,
    y: 0,
  },
  renameWorkspaceModal: {
    open: false,
    workspaceId: null,
    workspaceName: '',
  },
  deleteWorkspaceModal: {
    open: false,
    workspaceId: null,
    workspaceName: '',
  },
  notificationCenter: {
    open: false,
  },
  integrationsPanel: {
    open: false,
  },
  compareMode: {
    active: false,
    selectedFormIds: [],
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openContextMenu(state, action) {
      const { formId, x, y } = action.payload;
      state.contextMenu = { open: true, formId, x, y };
    },
    closeContextMenu(state) {
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    openDeleteModal(state, action) {
      const { formId, formTitle } = action.payload;
      state.deleteModal = { open: true, formId, formTitle };
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    closeDeleteModal(state) {
      state.deleteModal = { open: false, formId: null, formTitle: '' };
    },
    openDuplicateModal(state, action) {
      const { formId, formTitle } = action.payload;
      state.duplicateModal = { open: true, formId, formTitle };
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    closeDuplicateModal(state) {
      state.duplicateModal = { open: false, formId: null, formTitle: '' };
    },
    openArchiveModal(state, action) {
      const { formId, formTitle, responses } = action.payload;
      state.archiveModal = { open: true, formId, formTitle, responses };
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    closeArchiveModal(state) {
      state.archiveModal = { open: false, formId: null, formTitle: '', responses: 0 };
    },
    openPauseModal(state, action) {
      const { formId, formTitle } = action.payload;
      state.pauseModal = { open: true, formId, formTitle };
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    closePauseModal(state) {
      state.pauseModal = { open: false, formId: null, formTitle: '' };
    },
    openFormOverlay(state, action) {
      state.formOverlay = { open: true, formId: action.payload };
    },
    closeFormOverlay(state) {
      state.formOverlay = { open: false, formId: null };
    },
    openSearchPalette(state) {
      state.searchPalette.open = true;
    },
    closeSearchPalette(state) {
      state.searchPalette.open = false;
    },
    openCreateWorkspaceModal(state) {
      state.createWorkspaceModal.open = true;
    },
    closeCreateWorkspaceModal(state) {
      state.createWorkspaceModal.open = false;
    },
    openCreateNewFormModal(state) {
      state.createNewFormModal.open = true;
    },
    closeCreateNewFormModal(state) {
      state.createNewFormModal.open = false;
    },
    openShareModal(state, action) {
      const { formId, formTitle } = action.payload;
      state.shareModal = { open: true, formId, formTitle };
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    closeShareModal(state) {
      state.shareModal = { open: false, formId: null, formTitle: '' };
    },
    openWorkspaceContextMenu(state, action) {
      const { workspaceId, x, y } = action.payload;
      state.workspaceContextMenu = { open: true, workspaceId, x, y };
    },
    closeWorkspaceContextMenu(state) {
      state.workspaceContextMenu = { open: false, workspaceId: null, x: 0, y: 0 };
    },
    openRenameWorkspaceModal(state, action) {
      const { workspaceId, workspaceName } = action.payload;
      state.renameWorkspaceModal = { open: true, workspaceId, workspaceName };
      state.workspaceContextMenu = { open: false, workspaceId: null, x: 0, y: 0 };
    },
    closeRenameWorkspaceModal(state) {
      state.renameWorkspaceModal = { open: false, workspaceId: null, workspaceName: '' };
    },
    openDeleteWorkspaceModal(state, action) {
      const { workspaceId, workspaceName } = action.payload;
      state.deleteWorkspaceModal = { open: true, workspaceId, workspaceName };
      state.workspaceContextMenu = { open: false, workspaceId: null, x: 0, y: 0 };
    },
    closeDeleteWorkspaceModal(state) {
      state.deleteWorkspaceModal = { open: false, workspaceId: null, workspaceName: '' };
    },
    toggleNotificationCenter(state) {
      state.notificationCenter.open = !state.notificationCenter.open;
      if (state.notificationCenter.open) {
        state.integrationsPanel.open = false;
      }
    },
    closeNotificationCenter(state) {
      state.notificationCenter.open = false;
    },
    toggleIntegrationsPanel(state) {
      state.integrationsPanel.open = !state.integrationsPanel.open;
      if (state.integrationsPanel.open) {
        state.notificationCenter.open = false;
      }
    },
    closeIntegrationsPanel(state) {
      state.integrationsPanel.open = false;
    },
    openCompareMode(state, action) {
      const { formId } = action.payload;
      state.compareMode.active = true;
      if (!state.compareMode.selectedFormIds.includes(formId)) {
        state.compareMode.selectedFormIds = [formId];
      }
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    closeCompareMode(state) {
      state.compareMode = { active: false, selectedFormIds: [] };
    },
    toggleCompareForm(state, action) {
      const formId = action.payload;
      const ids = state.compareMode.selectedFormIds;
      if (ids.includes(formId)) {
        state.compareMode.selectedFormIds = ids.filter((id) => id !== formId);
      } else if (ids.length < MAX_COMPARE_FORMS) {
        state.compareMode.selectedFormIds = [...ids, formId];
      }
    },
    clearCompareSelection(state) {
      state.compareMode.selectedFormIds = [];
    },
    openAnalyticsComparePicker(state, action) {
      const { formId } = action.payload;
      state.compareMode.active = true;
      const cur = [...state.compareMode.selectedFormIds];
      if (!cur.includes(formId)) {
        state.compareMode.selectedFormIds =
          cur.length >= MAX_COMPARE_FORMS ? cur : [...cur, formId];
      }
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    deactivateCompareModeKeepSelection(state) {
      state.compareMode.active = false;
    },
  },
});

export const {
  openContextMenu,
  closeContextMenu,
  openDeleteModal,
  closeDeleteModal,
  openDuplicateModal,
  closeDuplicateModal,
  openFormOverlay,
  closeFormOverlay,
  openSearchPalette,
  closeSearchPalette,
  openCreateWorkspaceModal,
  closeCreateWorkspaceModal,
  openCreateNewFormModal,
  closeCreateNewFormModal,
  openArchiveModal,
  closeArchiveModal,
  openPauseModal,
  closePauseModal,
  openShareModal,
  closeShareModal,
  openWorkspaceContextMenu,
  closeWorkspaceContextMenu,
  openRenameWorkspaceModal,
  closeRenameWorkspaceModal,
  openDeleteWorkspaceModal,
  closeDeleteWorkspaceModal,
  toggleNotificationCenter,
  closeNotificationCenter,
  toggleIntegrationsPanel,
  closeIntegrationsPanel,
  openCompareMode,
  closeCompareMode,
  toggleCompareForm,
  clearCompareSelection,
  openAnalyticsComparePicker,
  deactivateCompareModeKeepSelection,
} = uiSlice.actions;

export default uiSlice.reducer;

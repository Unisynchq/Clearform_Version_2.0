import { createSlice } from '@reduxjs/toolkit';

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
  newFormModal: {
    open: false,
  },
  shareModal: {
    open: false,
    formId: null,
    formTitle: '',
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
    openNewFormModal(state) {
      state.newFormModal.open = true;
    },
    closeNewFormModal(state) {
      state.newFormModal.open = false;
    },
    openShareModal(state, action) {
      const { formId, formTitle } = action.payload;
      state.shareModal = { open: true, formId, formTitle };
      state.contextMenu = { open: false, formId: null, x: 0, y: 0 };
    },
    closeShareModal(state) {
      state.shareModal = { open: false, formId: null, formTitle: '' };
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
  openNewFormModal,
  closeNewFormModal,
  openArchiveModal,
  closeArchiveModal,
  openShareModal,
  closeShareModal,
} = uiSlice.actions;

export default uiSlice.reducer;

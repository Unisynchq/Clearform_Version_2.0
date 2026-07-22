/** True when any centered modal or form overlay should push the dashboard canvas back. */
export const selectIsGlobalOverlayActive = (state) => {
  const ui = state.ui;
  return (
    ui.createNewFormModal.open ||
    ui.templatePreviewModal.open ||
    ui.startWithTemplateModal.open ||
    ui.createWorkspaceModal.open ||
    ui.deleteModal.open ||
    ui.duplicateModal.open ||
    ui.archiveModal.open ||
    ui.assignFormWorkspaceModal.open ||
    ui.pauseModal.open ||
    ui.formOverlay.open ||
    ui.shareModal.open ||
    ui.renameWorkspaceModal.open ||
    ui.deleteWorkspaceModal.open ||
    ui.confirmModal.open ||
    ui.notificationCenter.open
  );
};

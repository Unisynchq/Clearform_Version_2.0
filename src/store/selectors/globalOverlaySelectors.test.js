import { describe, it, expect } from 'vitest';
import { selectIsGlobalOverlayActive } from './globalOverlaySelectors';

const closedUi = {
  createNewFormModal: { open: false },
  createWorkspaceModal: { open: false },
  deleteModal: { open: false },
  duplicateModal: { open: false },
  archiveModal: { open: false },
  pauseModal: { open: false },
  formOverlay: { open: false },
  shareModal: { open: false },
  renameWorkspaceModal: { open: false },
  deleteWorkspaceModal: { open: false },
  confirmModal: { open: false },
  notificationCenter: { open: false },
  integrationsPanel: { open: false, formId: null },
  searchPalette: { open: false },
};

const baseState = { ui: closedUi };

describe('selectIsGlobalOverlayActive', () => {
  it('is false when all overlay flags are closed', () => {
    expect(selectIsGlobalOverlayActive(baseState)).toBe(false);
  });

  it.each([
    ['createNewFormModal', { createNewFormModal: { open: true } }],
    ['createWorkspaceModal', { createWorkspaceModal: { open: true } }],
    ['deleteModal', { deleteModal: { open: true } }],
    ['duplicateModal', { duplicateModal: { open: true } }],
    ['archiveModal', { archiveModal: { open: true } }],
    ['pauseModal', { pauseModal: { open: true } }],
    ['formOverlay', { formOverlay: { open: true } }],
    ['shareModal', { shareModal: { open: true } }],
    ['renameWorkspaceModal', { renameWorkspaceModal: { open: true } }],
    ['deleteWorkspaceModal', { deleteWorkspaceModal: { open: true } }],
    ['confirmModal', { confirmModal: { open: true } }],
  ])('is true when %s is open', (_label, patch) => {
    expect(
      selectIsGlobalOverlayActive({
        ui: { ...closedUi, ...patch },
      }),
    ).toBe(true);
  });

  it('is true when notification center is open', () => {
    expect(
      selectIsGlobalOverlayActive({
        ui: { ...closedUi, notificationCenter: { open: true } },
      }),
    ).toBe(true);
  });

  it('is false for integrations panel and search palette', () => {
    expect(
      selectIsGlobalOverlayActive({
        ui: {
          ...closedUi,
          integrationsPanel: { open: true },
          searchPalette: { open: true },
        },
      }),
    ).toBe(false);
  });
});

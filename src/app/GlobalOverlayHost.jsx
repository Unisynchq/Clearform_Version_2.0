import { createPortal } from 'react-dom';
import RouteErrorBoundary from '@/components/errors/RouteErrorBoundary';
import OverlayErrorFallback from '@/components/errors/OverlayErrorFallback';
import FormContextMenu from '@/features/forms/components/FormContextMenu';
import DeleteFormModal from '@/features/forms/components/DeleteFormModal';
import DuplicateFormModal from '@/features/forms/components/DuplicateFormModal';
import ArchiveFormModal from '@/features/forms/components/ArchiveFormModal';
import AssignFormWorkspaceModal from '@/features/forms/components/AssignFormWorkspaceModal';
import PauseFormModal from '@/features/forms/components/PauseFormModal';
import FormOverlayModal from '@/features/forms/components/FormOverlayModal';
import CreateWorkspaceModal from '@/features/forms/components/CreateWorkspaceModal';
import ShareFormModal from '@/features/forms/components/ShareFormModal';
import WorkspaceContextMenu from '@/features/forms/components/WorkspaceContextMenu';
import RenameWorkspaceModal from '@/features/forms/components/RenameWorkspaceModal';
import DeleteWorkspaceModal from '@/features/forms/components/DeleteWorkspaceModal';
import CompareModeDock from '@/features/forms/components/CompareModeDock';

/**
 * Dashboard overlays portaled to document.body so they stay sharp while
 * MainLayout applies global push-back to the canvas behind them.
 */
const GlobalOverlayHost = () => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <RouteErrorBoundary fallback={OverlayErrorFallback}>
      <FormContextMenu />
      <DeleteFormModal />
      <DuplicateFormModal />
      <ArchiveFormModal />
      <AssignFormWorkspaceModal />
      <PauseFormModal />
      <FormOverlayModal />
      <CreateWorkspaceModal />
      <ShareFormModal />
      <WorkspaceContextMenu />
      <RenameWorkspaceModal />
      <DeleteWorkspaceModal />
      <CompareModeDock />
    </RouteErrorBoundary>,
    document.body,
  );
};

export default GlobalOverlayHost;

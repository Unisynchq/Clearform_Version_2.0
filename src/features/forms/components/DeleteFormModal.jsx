import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RiDeleteBinLine } from 'react-icons/ri';
import { closeDeleteModal } from '@/store/slices/uiSlice';
import { deleteForm, loadFormsFromApi } from '@/store/slices/formsSlice';
import { deleteFormRequest, permanentDeleteFormRequest } from '@/components/analytics/analyticsFormActions';
import { useToast } from '@/hooks/useToast';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';

/**
 * Soft-delete → only "Moving…" / Move to Trash.
 * Permanent (from trash) → only "Deleting…" / Delete Permanently.
 * Mode is frozen when the modal opens so Redux form status updates never flip the label.
 */
const DeleteFormModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  /** 'move' | 'permanent' — set once per open, never changes until close. */
  const [actionMode, setActionMode] = useState(null);

  const { open, formId, formTitle, redirectAfterDelete, isTrash } = useSelector(
    (s) => s.ui.deleteModal,
  );
  const form = useSelector((s) => s.forms.forms.find((f) => f.id === formId));

  useEffect(() => {
    if (!open) {
      setActionMode(null);
      setDeleting(false);
      return;
    }
    // Only the flag passed into openDeleteModal — do not watch form.status
    // (after Move to Trash the form becomes trash and would flip labels).
    setActionMode(isTrash ? 'permanent' : 'move');
  }, [open, isTrash]);

  const mode = actionMode ?? (isTrash ? 'permanent' : 'move');
  const isPermanent = mode === 'permanent';

  const handleDelete = async () => {
    if (!formId || deleting || !actionMode) return;
    const permanent = actionMode === 'permanent';
    setDeleting(true);
    try {
      if (permanent) {
        await permanentDeleteFormRequest({ formId });
      } else {
        await deleteFormRequest({ formId });
      }
      dispatch(deleteForm(formId));
      await dispatch(loadFormsFromApi());
      dispatch(closeDeleteModal());
      if (redirectAfterDelete) {
        showToast({
          type: 'success',
          message: permanent ? 'Form deleted permanently' : 'Form moved to trash',
        });
        navigate('/dashboard');
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Failed to delete form. Try again.',
        duration: 4500,
      });
    } finally {
      setDeleting(false);
    }
  };

  const responseCount = form?.responses ?? 0;

  return (
    <ConfirmActionModal
      open={open}
      onCancel={() => dispatch(closeDeleteModal())}
      onConfirm={handleDelete}
      isLoading={deleting}
      title={
        isPermanent
          ? `Permanently delete "${formTitle}"?`
          : `Move "${formTitle}" to Trash?`
      }
      warning={
        isPermanent
          ? 'This action cannot be undone. All data and responses will be lost forever.'
          : `Into the Trash it goes.${responseCount > 0 ? ` ${responseCount} responses` : ''} · 30 days to undo · restores as Draft`
      }
      confirmLabel={isPermanent ? 'Delete Permanently' : 'Move to Trash'}
      loadingLabel={isPermanent ? 'Deleting…' : 'Moving…'}
      confirmIcon={RiDeleteBinLine}
      isDanger={true}
    />
  );
};

export default DeleteFormModal;

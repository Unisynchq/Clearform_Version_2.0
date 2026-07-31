import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RiDeleteBinLine } from 'react-icons/ri';
import { closeDeleteModal } from '@/store/slices/uiSlice';
import { deleteForm, loadFormsFromApi } from '@/store/slices/formsSlice';
import { deleteFormRequest, permanentDeleteFormRequest } from '@/components/analytics/analyticsFormActions';
import { useToast } from '@/hooks/useToast';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';

const DeleteFormModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const { open, formId, formTitle, redirectAfterDelete } = useSelector((s) => s.ui.deleteModal);
  const form = useSelector((s) => s.forms.forms.find((f) => f.id === formId));

  const isTrash = form?.status === 'trash';

  const handleDelete = async () => {
    if (!formId || deleting) return;
    setDeleting(true);
    try {
      if (isTrash) {
        await permanentDeleteFormRequest({ formId });
      } else {
        await deleteFormRequest({ formId });
      }
      dispatch(deleteForm(formId));
      await dispatch(loadFormsFromApi());
      dispatch(closeDeleteModal());
      if (redirectAfterDelete) {
        showToast({ type: 'success', message: isTrash ? 'Form deleted permanently' : 'Form moved to trash' });
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
      title={isTrash ? `Permanently delete "${formTitle}"?` : `Delete "${formTitle}"?`}
      warning={isTrash ? "This action cannot be undone. All data and responses will be lost forever." : `Into the Trash it goes.${responseCount > 0 ? ` ${responseCount} responses` : ''} · 30 days to undo · restores as Draft`}
      confirmLabel={isTrash ? "Delete Permanently" : "Move to Trash"}
      loadingLabel={isTrash ? "Deleting…" : "Moving…"}
      confirmIcon={RiDeleteBinLine}
      isDanger={true}
    />
  );
};

export default DeleteFormModal;

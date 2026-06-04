import { RiDeleteBinLine, RiPauseLine } from 'react-icons/ri';
import ConfirmActionModal from '../ui/ConfirmActionModal';

export function PauseFormModal({ open, formName, onCancel, onConfirm, isLoading }) {
  return (
    <ConfirmActionModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={`Pause "${formName}"?`}
      warning="Form will be paused and will stop taking responses until removed."
      confirmLabel="Pause form"
      loadingLabel="Pausing…"
      confirmIcon={RiPauseLine}
      headerIcon={RiPauseLine}
      headerIconClass="bg-[#fef6e4] text-[#8a5b1c]"
      confirmClassName="bg-[#fef6e4] text-[#8a5b1c] hover:bg-[#fcecd0]"
    />
  );
}

export function DeleteFormModal({ open, formName, onCancel, onConfirm, isLoading }) {
  return (
    <ConfirmActionModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={`Delete "${formName}"?`}
      warning="All data for this form will be permanently deleted."
      confirmLabel="Delete"
      loadingLabel="Deleting…"
      confirmIcon={RiDeleteBinLine}
      headerIcon={RiDeleteBinLine}
      headerIconClass="bg-[#fdecea] text-[#c53030]"
      confirmClassName="bg-[#e05c4b] text-white hover:bg-[#d14f3f]"
    />
  );
}

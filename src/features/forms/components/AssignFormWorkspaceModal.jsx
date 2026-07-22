import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiFolderTransferLine } from 'react-icons/ri';
import { closeAssignFormWorkspaceModal } from '@/store/slices/uiSlice';
import { assignFormToWorkspace, selectNavWorkspaces } from '@/store/slices/formsSlice';
import { NO_WORKSPACE_ID } from '@/features/forms/constants/workspaces';
import { useToast } from '@/hooks/useToast';

const AssignFormWorkspaceModalInner = ({ formId, formTitle, currentWorkspaceId }) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const workspaces = useSelector(selectNavWorkspaces);
  const [selectedId, setSelectedId] = useState(currentWorkspaceId);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving || selectedId === currentWorkspaceId) return;
    setSaving(true);
    try {
      await dispatch(assignFormToWorkspace({ formId, workspaceId: selectedId }));
      showToast({ type: 'success', message: 'Workspace updated', duration: 2500 });
      dispatch(closeAssignFormWorkspaceModal());
    } catch {
      showToast({ type: 'error', message: 'Could not update workspace. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => dispatch(closeAssignFormWorkspaceModal())}
        className="fixed inset-0 z-[300] bg-black/20"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] w-[400px] p-6 flex flex-col gap-4"
        role="dialog"
        aria-labelledby="assign-workspace-title"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#f4f3ef] flex items-center justify-center shrink-0">
            <RiFolderTransferLine size={18} className="text-[#1a1a1c]" />
          </div>
          <div className="min-w-0">
            <p id="assign-workspace-title" className="text-[17px] font-bold text-[#111827] leading-[24px]">
              Move to workspace
            </p>
            <p className="text-[13px] text-[#6b6966] truncate">{formTitle}</p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-[#6b6966]">Workspace</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full text-[14px] text-[#1a1a1c] border border-[#e5e3dc] rounded-[10px] px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(26,26,28,0.12)] cursor-pointer"
          >
            <option value={NO_WORKSPACE_ID}>No workspace (all forms only)</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={String(ws.id)}>
                {ws.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedId === currentWorkspaceId}
            className="flex-1 bg-[#1a1a1c] text-white text-[14px] font-semibold py-[11px] rounded-[10px] hover:bg-[#2c2c2e] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => dispatch(closeAssignFormWorkspaceModal())}
            className="px-5 py-[11px] text-[14px] font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-[10px] hover:bg-[#f9fafb] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </>
  );
};

const AssignFormWorkspaceModal = () => {
  const { open, formId, formTitle } = useSelector((s) => s.ui.assignFormWorkspaceModal);
  const form = useSelector((s) => s.forms.forms.find((f) => f.id === formId));
  const currentWorkspaceId =
    form?.workspace == null || form?.workspace === ''
      ? NO_WORKSPACE_ID
      : String(form.workspace);

  return (
    <AnimatePresence>
      {open && formId != null ? (
        <AssignFormWorkspaceModalInner
          key={String(formId)}
          formId={formId}
          formTitle={formTitle}
          currentWorkspaceId={currentWorkspaceId}
        />
      ) : null}
    </AnimatePresence>
  );
};

export default AssignFormWorkspaceModal;

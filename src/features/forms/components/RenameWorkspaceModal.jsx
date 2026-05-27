import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine } from 'react-icons/ri';
import { closeRenameWorkspaceModal } from '@/store/slices/uiSlice';
import { renameWorkspace } from '@/store/slices/formsSlice';

/* Remount when `workspaceId` changes so the input initializes without a sync effect. */
const RenameWorkspaceModalInner = ({ workspaceId, workspaceName }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState(() => workspaceName);

  const handleClose = () => {
    dispatch(closeRenameWorkspaceModal());
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch(renameWorkspace({ workspaceId, newName: trimmed }));
    dispatch(closeRenameWorkspaceModal());
  };

  return (
    <div className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-white rounded-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-[380px] p-6 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px] tracking-[-0.2px]">
              Rename workspace
            </h2>
            <p className="text-[13px] text-[#6b6966] leading-[19px]">
              Give this workspace a new name.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#a8a6a0] hover:text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors cursor-pointer shrink-0"
          >
            <RiCloseLine size={16} />
          </button>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#1a1a1c] leading-[18px]">
            Workspace name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="w-full px-3 py-2 text-[13px] text-[#1a1a1c] placeholder:text-[#c9c7bf] bg-white border border-[#e5e3dc] rounded-[8px] outline-none focus:border-[#1a1a1c] transition-colors leading-[19px]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="text-[13px] font-medium text-[#6b6966] hover:text-[#1a1a1c] transition-colors cursor-pointer px-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || name.trim() === workspaceName}
            className="bg-[#1a1a1c] text-white text-[13px] font-medium px-[15px] py-[8px] rounded-[8px] hover:bg-[#2c2c2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RenameWorkspaceModal = () => {
  const dispatch = useDispatch();
  const { open, workspaceId, workspaceName } = useSelector((s) => s.ui.renameWorkspaceModal);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => dispatch(closeRenameWorkspaceModal())}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <RenameWorkspaceModalInner
            key={workspaceId ?? 'ws'}
            workspaceId={workspaceId}
            workspaceName={workspaceName}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default RenameWorkspaceModal;

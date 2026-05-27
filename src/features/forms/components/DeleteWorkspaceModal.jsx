import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine, RiDeleteBinLine } from 'react-icons/ri';
import { closeDeleteWorkspaceModal } from '@/store/slices/uiSlice';
import { deleteWorkspace } from '@/store/slices/formsSlice';

const DeleteWorkspaceModal = () => {
  const dispatch = useDispatch();
  const { open, workspaceId, workspaceName } = useSelector((s) => s.ui.deleteWorkspaceModal);

  const handleClose = () => dispatch(closeDeleteWorkspaceModal());

  const handleDelete = () => {
    dispatch(deleteWorkspace(workspaceId));
    dispatch(closeDeleteWorkspaceModal());
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 z-[300] bg-black/20"
          />

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
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-[#fef2f0] flex items-center justify-center shrink-0">
                    <RiDeleteBinLine size={16} className="text-[#d4522a]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px] tracking-[-0.2px]">
                      Delete workspace
                    </h2>
                    <p className="text-[13px] text-[#6b6966] leading-[19px]">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#a8a6a0] hover:text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors cursor-pointer shrink-0"
                >
                  <RiCloseLine size={16} />
                </button>
              </div>

              {/* Body */}
              <p className="text-[13px] text-[#6b6966] leading-[20px]">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-[#1a1a1c]">{workspaceName}</span>?
                Forms inside will not be deleted but will be moved to{' '}
                <span className="font-medium text-[#1a1a1c]">All forms</span>.
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleClose}
                  className="text-[13px] font-medium text-[#6b6966] hover:text-[#1a1a1c] transition-colors cursor-pointer px-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-[#d4522a] text-white text-[13px] font-medium px-[15px] py-[8px] rounded-[8px] hover:bg-[#b8451f] transition-colors cursor-pointer"
                >
                  Delete workspace
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteWorkspaceModal;

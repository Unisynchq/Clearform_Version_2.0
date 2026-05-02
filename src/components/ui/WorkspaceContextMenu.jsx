import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiEditLine, RiSettings3Line, RiDeleteBinLine } from 'react-icons/ri';
import {
  closeWorkspaceContextMenu,
  openRenameWorkspaceModal,
  openDeleteWorkspaceModal,
} from '../../redux/slices/uiSlice';

const WorkspaceContextMenu = () => {
  const dispatch = useDispatch();
  const { open, workspaceId, x, y } = useSelector((s) => s.ui.workspaceContextMenu);
  const workspace = useSelector((s) => s.forms.workspaces.find((w) => w.id === workspaceId));
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        dispatch(closeWorkspaceContextMenu());
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') dispatch(closeWorkspaceContextMenu());
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, dispatch]);

  const handleRename = () => {
    dispatch(openRenameWorkspaceModal({
      workspaceId,
      workspaceName: workspace?.label ?? '',
    }));
  };

  const handleSettings = () => {
    dispatch(closeWorkspaceContextMenu());
  };

  const handleDelete = () => {
    dispatch(openDeleteWorkspaceModal({
      workspaceId,
      workspaceName: workspace?.label ?? '',
    }));
  };

  const safeX = Math.min(x, window.innerWidth - 200);
  const safeY = Math.min(y, window.innerHeight - 150);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12 }}
          style={{ top: safeY, left: safeX }}
          className="fixed z-[200] bg-white border border-[#e5e3dc] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-1.5 w-[188px]"
        >
          {/* Rename */}
          <button
            onClick={handleRename}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-[7px] text-[13px] font-medium text-[#1a1a1c] leading-[19.5px] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <RiEditLine size={14} className="text-[#6b6966]" />
              Rename
            </div>
            <span className="text-[11px] text-[#a8a6a0] font-normal">⌘R</span>
          </button>

          {/* Settings */}
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] font-medium text-[#1a1a1c] leading-[19.5px] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
          >
            <RiSettings3Line size={14} className="text-[#6b6966]" />
            Settings
          </button>

          {/* Divider */}
          <div className="h-px bg-[#e5e3dc] mx-2 my-1" />

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] font-medium text-[#d4522a] leading-[19.5px] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
          >
            <RiDeleteBinLine size={14} className="text-[#d4522a]" />
            Delete workspace
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkspaceContextMenu;

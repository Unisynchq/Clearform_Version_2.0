import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine, RiArrowRightSLine } from 'react-icons/ri';
import { closeCreateWorkspaceModal } from '@/store/slices/uiSlice';
import { createWorkspaceThunk } from '@/store/slices/formsSlice';

const COLOR_OPTIONS = [
  { id: 'blue',   value: '#3b82f6' },
  { id: 'green',  value: '#22c55e' },
  { id: 'amber',  value: '#f59e0b' },
  { id: 'red',    value: '#ef4444' },
  { id: 'black',  value: '#1a1a1c' },
];

const CreateWorkspaceModal = () => {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.createWorkspaceModal.open);

  const [name, setName]   = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);

  const handleClose = () => {
    dispatch(closeCreateWorkspaceModal());
    setName('');
    setColor(COLOR_OPTIONS[0].value);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    dispatch(createWorkspaceThunk({ label: name.trim(), color }));
    dispatch(closeCreateWorkspaceModal());
    setName('');
    setColor(COLOR_OPTIONS[0].value);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-workspace-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-[400px] p-6 flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2
                    id="create-workspace-title"
                    className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px] tracking-[-0.2px]"
                  >
                    Create new workspace
                  </h2>
                  <p className="text-[13px] text-[#6b6966] leading-[19px]">
                    Organise your forms by team, project or client.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#a8a6a0] hover:text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors cursor-pointer shrink-0"
                >
                  <RiCloseLine size={16} />
                </button>
              </div>

              {/* Workspace name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#1a1a1c] leading-[18px]">
                  Workspace name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Client: Inc Corp"
                  autoFocus
                  className="w-full px-3 py-2 text-[13px] text-[#1a1a1c] placeholder:text-[#c9c7bf] bg-white border border-[#e5e3dc] rounded-[8px] outline-none focus:border-[#1a1a1c] transition-colors leading-[19px]"
                />
              </div>

              {/* Colour picker */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[#1a1a1c] leading-[18px]">
                  Colour
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setColor(opt.value)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shrink-0"
                      style={{ backgroundColor: opt.value }}
                    >
                      {color === opt.value && (
                        <span className="w-2.5 h-2.5 rounded-full bg-white/80 block" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[12px] text-[#6b6966] leading-[18px]">
                After creating, you&apos;ll land on this workspace&apos;s empty dashboard.
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
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex items-center gap-1.5 bg-[#1a1a1c] text-white text-[13px] font-medium px-[15px] py-[8px] rounded-[8px] hover:bg-[#2c2c2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Create workspace
                  <RiArrowRightSLine size={14} />
                </button>
              </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateWorkspaceModal;

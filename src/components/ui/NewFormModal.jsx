import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine, RiArrowRightSLine } from 'react-icons/ri';
import { closeNewFormModal } from '../../redux/slices/uiSlice';
import { createFormThunk } from '../../redux/slices/formsSlice';

const NewFormModal = () => {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.newFormModal.open);

  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    dispatch(closeNewFormModal());
    setTitle('');
  };

  const handleCreate = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await dispatch(createFormThunk({ title: title.trim() }));
    setIsSubmitting(false);
    handleClose();
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

          <div className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-white rounded-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-[400px] p-6 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px] tracking-[-0.2px]">
                    Create new form
                  </h2>
                  <p className="text-[13px] text-[#6b6966] leading-[19px]">
                    Give your form a name to get started.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#a8a6a0] hover:text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors cursor-pointer shrink-0"
                >
                  <RiCloseLine size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#1a1a1c] leading-[18px]">
                  Form name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Customer feedback survey"
                  autoFocus
                  className="w-full px-3 py-2 text-[13px] text-[#1a1a1c] placeholder:text-[#c9c7bf] bg-white border border-[#e5e3dc] rounded-[8px] outline-none focus:border-[#1a1a1c] transition-colors leading-[19px]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleClose}
                  className="text-[13px] font-medium text-[#6b6966] hover:text-[#1a1a1c] transition-colors cursor-pointer px-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || isSubmitting}
                  className="flex items-center gap-1.5 bg-[#1a1a1c] text-white text-[13px] font-medium px-[15px] py-[8px] rounded-[8px] hover:bg-[#2c2c2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating…' : 'Create form'}
                  {!isSubmitting && <RiArrowRightSLine size={14} />}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewFormModal;

import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiPauseLine, RiAlertLine } from 'react-icons/ri';
import { closePauseModal } from '@/store/slices/uiSlice';
import { setFormPause } from '@/store/slices/formsSlice';
import { buildOneDayPausePayload } from '../utils/formPause';

const PauseFormModal = () => {
  const dispatch = useDispatch();
  const { open, formId, formTitle } = useSelector((s) => s.ui.pauseModal);

  const handlePause = () => {
    if (formId) {
      dispatch(setFormPause(buildOneDayPausePayload(formId)));
    }
    dispatch(closePauseModal());
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
            onClick={() => dispatch(closePauseModal())}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] w-[440px] p-6 flex flex-col gap-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#fffbeb] flex items-center justify-center shrink-0">
                <RiPauseLine size={18} className="text-[#d97706]" />
              </div>
              <p className="text-[17px] font-bold text-[#111827] leading-[24px]">
                Pause &ldquo;{formTitle}&rdquo;?
              </p>
            </div>

            <div className="flex items-start gap-3 bg-[#fffbeb] border border-[#fde68a] rounded-[12px] px-4 py-3">
              <RiAlertLine size={16} className="shrink-0 mt-px text-[#d97706]" />
              <p className="text-[13px] text-[#92400e] leading-[20px]">
                The form will stop accepting new responses for 24 hours. You can resume early from the form overview.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-semibold py-[11px] rounded-[10px] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
              >
                <RiPauseLine size={15} />
                Pause for 24 hours
              </button>
              <button
                onClick={() => dispatch(closePauseModal())}
                className="px-5 py-[11px] text-[14px] font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-[10px] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PauseFormModal;

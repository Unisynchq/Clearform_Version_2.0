import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { FiArchive, FiAlertTriangle } from 'react-icons/fi';
import { closeArchiveModal } from '@/store/slices/uiSlice';
import { archiveFormThunk } from '@/store/slices/formsSlice';

const ArchiveFormModal = () => {
  const dispatch = useDispatch();
  const { open, formId, formTitle, responses } = useSelector((s) => s.ui.archiveModal);
  const form = useSelector((s) => s.forms.forms.find((f) => f.id === formId));

  const pendingResponses = form?.responses ?? responses ?? 0;

  const handleArchive = () => {
    if (formId) dispatch(archiveFormThunk(formId));
    dispatch(closeArchiveModal());
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
            onClick={() => dispatch(closeArchiveModal())}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] w-[440px] p-6 flex flex-col gap-5"
          >
            {/* Icon + title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#fff7ed] flex items-center justify-center shrink-0">
                <FiArchive size={18} color="#f97316" strokeWidth={2} />
              </div>
              <p className="text-[17px] font-bold text-[#111827] leading-[24px]">
                Archive &ldquo;{formTitle}&rdquo; ?
              </p>
            </div>

            {/* Warning notice */}
            <div className="flex items-start gap-3 bg-[#fffbeb] border border-[#fde68a] rounded-[12px] px-4 py-3">
              <FiAlertTriangle size={16} color="#d97706" strokeWidth={2} className="shrink-0 mt-px" />
              <p className="text-[13px] text-[#92400e] leading-[20px]">
                Into the archive. Responses safe
                {pendingResponses > 0 ? ` · ${pendingResponses} pending lost` : ''}
                {' · '}reversible anytime
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleArchive}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-semibold py-[11px] rounded-[10px] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
              >
                <FiArchive size={15} strokeWidth={2.2} />
                Archive form
              </button>
              <button
                onClick={() => dispatch(closeArchiveModal())}
                className="px-5 py-[11px] text-[14px] font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-[10px] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                Keep live
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ArchiveFormModal;

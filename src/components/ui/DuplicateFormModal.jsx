import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { FiCopy } from 'react-icons/fi';
import { closeDuplicateModal } from '../../redux/slices/uiSlice';
import { duplicateFormThunk } from '../../redux/slices/formsSlice';

const DuplicateFormModal = () => {
  const dispatch = useDispatch();
  const { open, formId, formTitle } = useSelector((s) => s.ui.duplicateModal);
  const form = useSelector((s) => s.forms.forms.find((f) => f.id === formId));

  const [copyName, setCopyName] = useState('');

  useEffect(() => {
    if (open) setCopyName(`Copy of ${formTitle}`);
  }, [open, formTitle]);

  const handleDuplicate = () => {
    if (!form || !copyName.trim()) return;
    dispatch(duplicateFormThunk({ formId, copyName: copyName.trim() }));
    dispatch(closeDuplicateModal());
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
            onClick={() => dispatch(closeDuplicateModal())}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] w-[400px] p-6 flex flex-col gap-5"
          >
            {/* Icon + title */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#e8f0fe] border border-[#bfdbfe] flex items-center justify-center shrink-0 mt-0.5">
                <FiCopy size={17} color="#3b82f6" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px]">
                  Good forms deserve a twin
                </p>
                <p className="text-[12.5px] text-[#6b7280] leading-[18px] mt-0.5">
                  A copy will be saved as a Draft. Responses are not copied.
                </p>
              </div>
            </div>

            {/* Input — icon on left, label + value stacked on right */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-[#eef2ff] border border-[#a5b4fc] rounded-[10px] focus-within:border-[#6366f1] transition-colors">
              <div className="w-7 h-7 rounded-[7px] bg-[#c7d2fe] flex items-center justify-center shrink-0">
                <FiCopy size={14} color="#4f46e5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10.5px] font-medium text-[#6b7ab5] leading-none mb-[3px]">
                  Save copy as
                </span>
                <input
                  autoFocus
                  value={copyName}
                  onChange={(e) => setCopyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDuplicate()}
                  className="w-full text-[13.5px] font-medium text-[#1a1a1c] bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDuplicate}
                disabled={!copyName.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1c] text-white text-[13.5px] font-semibold py-[11px] rounded-[10px] hover:bg-[#2c2c2e] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <FiCopy size={14} strokeWidth={2.2} />
                Duplicate
              </button>
              <button
                onClick={() => dispatch(closeDuplicateModal())}
                className="px-5 py-[11px] text-[13.5px] font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-[10px] hover:bg-[#f9fafb] transition-colors cursor-pointer"
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

export default DuplicateFormModal;

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine } from 'react-icons/ri';
import { selectFilteredForms } from '../../redux/slices/formsSlice';
import { deactivateCompareModeKeepSelection } from '../../redux/slices/uiSlice';
import ComparePickerShell from './ComparePickerShell';
import WorkspaceChips from './WorkspaceChips';
import FormCard from './FormCard';

const ease = [0.25, 0.1, 0.25, 1];

/**
 * Full-screen overlay with the same picker surface as All Forms compare mode:
 * workspace pills, form grid (tap to toggle selection), Done to dismiss.
 */
function CompareFormPickerModal({ open, onClose }) {
  const dispatch = useDispatch();
  const filteredForms = useSelector(selectFilteredForms);
  const selectedIds = useSelector((s) => s.ui.compareMode.selectedFormIds);
  const selectedCount = selectedIds.length;

  const finalizeClose = useCallback(() => {
    dispatch(deactivateCompareModeKeepSelection());
    onClose();
  }, [dispatch, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') finalizeClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, finalizeClose]);

  const node = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="compare-form-picker"
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="presentation"
            className="absolute inset-0 bg-[#1a1916]/28 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={finalizeClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-form-picker-title"
            className="relative z-10 w-full max-w-[920px] max-h-[min(88vh,760px)] flex flex-col"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.28, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <ComparePickerShell className="min-h-0 max-h-full flex flex-col gap-5 shadow-[0px_8px_40px_rgba(0,0,0,0.12)]">
              <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5 shrink-0">
                <div className="min-w-0 flex-1">
                  <h2
                    id="compare-form-picker-title"
                    className="text-[13px] font-semibold text-[#17160e] tracking-[-0.2px] mb-2.5"
                  >
                    Select forms
                  </h2>
                  {selectedIds.length >= 2 ? (
                    <p className="mb-2 text-[11px] text-[#888780]">You can compare at most two forms at once.</p>
                  ) : null}
                  <WorkspaceChips embedded />
                </div>
                <button
                  type="button"
                  onClick={finalizeClose}
                  className="shrink-0 size-8 flex items-center justify-center rounded-full text-[#656462] hover:bg-[#f4f3ef] hover:text-[#1a1916] transition-colors cursor-pointer mt-0.5"
                  aria-label="Close"
                >
                  <RiCloseLine size={22} aria-hidden />
                </button>
              </div>

              <div className="overflow-y-auto min-h-0 max-h-[min(480px,calc(88vh-220px))] pr-1 -mr-0.5 overscroll-contain">
                {filteredForms.length === 0 ? (
                  <p className="text-[13px] text-[#6b6966] py-10 text-center">
                    No forms match the current filters. Adjust filters on Forms or create a form first.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredForms.map((form, index) => (
                      <motion.div
                        key={form.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.22,
                          delay: Math.min(index * 0.035, 0.35),
                          ease,
                        }}
                      >
                        <FormCard form={form} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 shrink-0 border-t border-[#eceae4] mt-1">
                <button
                  type="button"
                  onClick={finalizeClose}
                  className="text-[12px] font-medium text-[#6b6966] px-3.5 py-2 rounded-[8px] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={finalizeClose}
                  className="text-[12px] font-semibold text-white bg-[#17160e] px-4 py-2 rounded-[8px] hover:bg-[#2c2c2e] cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                >
                  Done{selectedCount ? ` (${selectedCount} selected)` : ''}
                </button>
              </div>
            </ComparePickerShell>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}

export default CompareFormPickerModal;
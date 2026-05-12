import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine } from 'react-icons/ri';

const FORMATS = ['PDF', 'CSV', 'XLSX'];

const AnalyticsExportModal = ({
  open,
  onClose,
  defaultName,
  rangeLabel,
  defaultFormat = 'PDF',
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[500] bg-black/35 backdrop-blur-[2px]"
            onMouseDown={onClose}
          />
          <div className="fixed inset-0 z-[501] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="export-report-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full max-w-[440px] bg-white rounded-[12px] border border-[#e5e3dc] shadow-[0_16px_48px_rgba(0,0,0,0.14)] overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9e7e0]">
                <h2 id="export-report-title" className="text-[16px] font-semibold text-[#1a1a1c]">
                  Export Report
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#6b6966] hover:bg-[#f4f3ef] cursor-pointer"
                  aria-label="Close"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
              <div className="px-5 py-5 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-[#646464]">Report name</span>
                  <input
                    type="text"
                    defaultValue={defaultName}
                    className="w-full rounded-[8px] border border-[#e5e3dc] px-3 py-2 text-[13px] text-[#1a1a1c] outline-none focus:border-[#17160e] focus:ring-2 focus:ring-black/5"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-[#646464]">Format</span>
                  <select
                    defaultValue={defaultFormat}
                    className="w-full rounded-[8px] border border-[#e5e3dc] px-3 py-2 text-[13px] text-[#1a1a1c] bg-white outline-none focus:border-[#17160e] cursor-pointer"
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-[#646464]">Date range</span>
                  <select
                    defaultValue={rangeLabel}
                    className="w-full rounded-[8px] border border-[#e5e3dc] px-3 py-2 text-[13px] text-[#1a1a1c] bg-white outline-none focus:border-[#17160e] cursor-pointer"
                  >
                    <option>All time</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>This quarter</option>
                  </select>
                </label>
              </div>
              <div className="px-5 pb-5 pt-0 flex flex-col gap-3">
                <p className="text-[11px] text-[#a8a6a0] leading-snug">
                  Exports will include all data in the selected range.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded-[8px] border border-[#e5e3dc] text-[13px] font-medium text-[#393939] hover:bg-[#f4f3ef] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded-[8px] bg-[#17160e] text-[13px] font-medium text-white hover:bg-[#2c2c2e] cursor-pointer"
                  >
                    Export →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsExportModal;

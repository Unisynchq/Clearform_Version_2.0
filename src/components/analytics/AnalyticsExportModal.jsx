import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine } from 'react-icons/ri';
import Select from '../ui/Select';
import { getFreshAuthToken } from '@/features/auth/utils/authTokenRefresh';
import { env } from '@/config/env';

const FORMAT_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'CSV', label: 'CSV' },
  { value: 'XLSX', label: 'XLSX' },
];

const RANGE_OPTIONS = [
  { value: 'All time', label: 'All time' },
  { value: 'Last 7 days', label: 'Last 7 days' },
  { value: 'Last 30 days', label: 'Last 30 days' },
  { value: 'Last 90 days', label: 'Last 90 days' },
  { value: 'This quarter', label: 'This quarter' },
];

const RANGE_PARAM_MAP = {
  'All time': 'all',
  'Last 7 days': '7d',
  'Last 30 days': '30d',
  'Last 90 days': '90d',
  'This quarter': '90d',
};

const AnalyticsExportModal = ({
  open,
  onClose,
  defaultName,
  rangeLabel,
  defaultFormat = 'PDF',
  formId,
}) => {
  const [format, setFormat] = useState(defaultFormat);
  const [range, setRange] = useState(rangeLabel ?? 'All time');
  const [isExporting, setIsExporting] = useState(false);
  const reportNameRef = useRef(defaultName);

  useEffect(() => {
    if (open) {
      setFormat(defaultFormat);
      setRange(rangeLabel ?? 'All time');
      reportNameRef.current = defaultName;
    }
  }, [open, defaultFormat, rangeLabel, defaultName]);

  const handleExport = async () => {
    if (format === 'PDF') {
      window.print();
      onClose();
      return;
    }
    if (!formId || !env.apiBaseUrl) {
      onClose();
      return;
    }
    setIsExporting(true);
    try {
      const fmt = format.toLowerCase();
      const rangeParam = RANGE_PARAM_MAP[range] ?? 'all';
      const name = reportNameRef.current ?? `responses-${formId}`;
      const token = await getFreshAuthToken();
      const url = `${env.apiBaseUrl}/forms/${formId}/responses/export?format=${fmt}&range=${rangeParam}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(`Export failed (${resp.status})`);
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      onClose();
    } catch {
      // Stay open so the user can try again; browser console has the error detail
    } finally {
      setIsExporting(false);
    }
  };

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
                    onChange={(e) => { reportNameRef.current = e.target.value; }}
                    className="w-full rounded-[8px] border border-[#e5e3dc] px-3 py-2 text-[13px] text-[#1a1a1c] outline-none focus:border-[#17160e] focus:ring-2 focus:ring-black/5"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-[#646464]">Format</span>
                  <Select
                    value={format}
                    onValueChange={setFormat}
                    options={FORMAT_OPTIONS}
                    aria-label="Export format"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-[#646464]">Date range</span>
                  <Select
                    value={range}
                    onValueChange={setRange}
                    options={RANGE_OPTIONS}
                    aria-label="Export date range"
                  />
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
                    onClick={handleExport}
                    disabled={isExporting}
                    className="h-9 px-4 rounded-[8px] bg-[#17160e] text-[13px] font-medium text-white hover:bg-[#2c2c2e] cursor-pointer disabled:opacity-60"
                  >
                    {isExporting ? 'Exporting…' : 'Export →'}
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

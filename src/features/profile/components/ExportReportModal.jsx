import { useEffect, useState } from 'react';
import { RiArrowDownSLine, RiCloseLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import { useToast } from '@/hooks/useToast';

const FORMAT_OPTIONS = ['PDF', 'CSV', 'JSON'];

const DATE_RANGE_OPTIONS = [
  'All time',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
];

const labelClass = 'text-[11px] font-normal text-[#6b6b68]';
const fieldClass =
  'w-full rounded-[8px] border border-[#d4d1c8] bg-white px-[13px] py-[10px] text-[12px] text-[#1a1a18] outline-none transition-colors focus:border-[#1a1a18]';
const selectWrapClass = 'relative';

const SelectChevron = () => (
  <RiArrowDownSLine
    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9e9e9a]"
    aria-hidden
  />
);

const ExportReportModal = ({
  open,
  onClose,
  defaultReportName = 'Clearform Account Export',
}) => {
  const { showToast } = useToast();
  const [reportName, setReportName] = useState(defaultReportName);
  const [format, setFormat] = useState('PDF');
  const [dateRange, setDateRange] = useState('All time');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (open) {
      setReportName(defaultReportName);
      setFormat('PDF');
      setDateRange('All time');
      setIsExporting(false);
    }
  }, [open, defaultReportName]);

  const handleClose = () => {
    if (isExporting) return;
    onClose();
  };

  const handleExport = async () => {
    const trimmed = reportName.trim();
    if (!trimmed) {
      showToast({ type: 'error', message: 'Enter a report name.', duration: 2200 });
      return;
    }

    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsExporting(false);
    onClose();
    showToast({
      type: 'success',
      message: `"${trimmed}" is being prepared as ${format}.`,
      duration: 2800,
    });
  };

  return (
    <ProfileModal
      open={open}
      onClose={handleClose}
      widthClass="w-[min(100%,400px)]"
      className="overflow-hidden rounded-[16px] border border-[#e8e6e0] p-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-[#e8e6e0] px-6 pb-4 pt-5">
          <h2 id="export-report-title" className="text-[15px] font-semibold text-[#1a1a18]">
            Export Report
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            className="flex size-7 items-center justify-center rounded-[4px] border border-[#e8e6e0] bg-[#f8f7f4] text-[#6b6b68] transition-colors hover:bg-[#f4f3ef] disabled:opacity-40"
            aria-label="Close"
          >
            <RiCloseLine size={14} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-report-name" className={labelClass}>
              Report name
            </label>
            <input
              id="export-report-name"
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className={fieldClass}
              disabled={isExporting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-report-format" className={labelClass}>
              Format
            </label>
            <div className={selectWrapClass}>
              <select
                id="export-report-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={`${fieldClass} appearance-none pr-9`}
                disabled={isExporting}
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-report-range" className={labelClass}>
              Date range
            </label>
            <div className={selectWrapClass}>
              <select
                id="export-report-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`${fieldClass} appearance-none pr-9`}
                disabled={isExporting}
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
            <p className="text-[10px] leading-[15px] text-[#9e9e9a]">
              Exports will include all data in the selected range
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e8e6e0] px-6 pb-4 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            className="rounded-[8px] border border-[#d4d1c8] bg-white px-[15px] py-2 text-[12px] font-normal text-[#1a1a18] transition-colors hover:bg-[#f8f7f4] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1 rounded-[8px] bg-[#1a1a18] px-3.5 py-2 text-[12px] font-normal text-white transition-colors hover:bg-[#333] disabled:opacity-70"
          >
            {isExporting ? 'Exporting…' : 'Export'}
            {!isExporting ? <span aria-hidden>→</span> : null}
          </button>
        </div>
      </div>
    </ProfileModal>
  );
};

export default ExportReportModal;

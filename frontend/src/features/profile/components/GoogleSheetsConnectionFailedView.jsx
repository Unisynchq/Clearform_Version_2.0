import { RiErrorWarningLine } from 'react-icons/ri';
import { formatGoogleSheetsErrorReference } from '@/features/profile/utils/googleSheetsConnection';

const FAILURE_REASONS = [
  'The browser tab was closed during the redirect',
  "Your Google account doesn't have permission to share this workspace",
];

const BulletItem = ({ children }) => (
  <li className="flex gap-2 text-[13px] leading-[19.5px] text-[#6b6b68]">
    <span className="shrink-0 font-semibold text-[#c53030]" aria-hidden>
      ·
    </span>
    <span>{children}</span>
  </li>
);

const GoogleSheetsConnectionFailedView = ({
  errorRef,
  onCancel,
  onGetHelp,
  onTryAgain,
}) => (
  <div className="flex flex-col">
    <div className="flex flex-col items-center gap-1.5 border-b border-[#f0f0ee] px-7 pb-6 pt-8">
      <div className="flex size-14 items-center justify-center rounded-[28px] border-2 border-[#fed7d7] bg-[#fff5f5] p-0.5">
        <RiErrorWarningLine size={24} className="text-[#c53030]" aria-hidden />
      </div>

      <h2 className="pt-2.5 text-center text-[16px] font-semibold text-[#1a1a18]">
        Connection failed
      </h2>

      <p className="max-w-[340px] text-center text-[13px] leading-[19.5px] text-[#6b6b68]">
        Clearform couldn&apos;t connect to Google Sheets. This usually happens when access is
        denied or the session expires during the redirect.
      </p>
    </div>

    <div className="flex flex-col gap-1.5 px-7 pb-7 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">
        What may have happened
      </p>
      <ul className="flex flex-col gap-2">
        {FAILURE_REASONS.map((reason) => (
          <BulletItem key={reason}>{reason}</BulletItem>
        ))}
      </ul>

      <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">
        Error reference
      </p>
      <pre className="whitespace-pre-wrap rounded-[6px] border border-[#e8e8e6] bg-[#f0efff] px-[15px] py-[13px] font-mono text-[12px] leading-normal text-[#6b6b68]">
        {formatGoogleSheetsErrorReference(errorRef)}
      </pre>
    </div>

    <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f0ee] px-7 pb-[22px] pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-[6px] px-3.5 py-2 text-[13px] font-medium text-[#6b6b68] transition-colors hover:bg-[#f7f7f6]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onGetHelp}
        className="rounded-[6px] border border-[#e8e8e6] bg-white px-[15px] py-2 text-[13px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6]"
      >
        Get help
      </button>
      <button
        type="button"
        onClick={onTryAgain}
        className="rounded-[6px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#333]"
      >
        Try again
      </button>
    </div>
  </div>
);

export default GoogleSheetsConnectionFailedView;

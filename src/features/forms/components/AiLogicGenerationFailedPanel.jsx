import { RiErrorWarningLine, RiRefreshLine } from 'react-icons/ri';

/**
 * Figma: Clearform-Changes — AI logic generation failed panel (node 1992:42314).
 */
const AiLogicGenerationFailedPanel = ({ onRetry, onSwitchToManual, className = '' }) => (
  <div
    className={`relative mx-auto w-full max-w-[340px] rounded-[16px] border border-[#e5e5e2] bg-white px-6 py-7 ${className}`}
    role="alertdialog"
    aria-labelledby="ai-logic-error-title"
    aria-describedby="ai-logic-error-desc"
  >
    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[13px] border border-[#e5e0d8] bg-[#fafaf8]">
      <RiErrorWarningLine size={22} className="text-[#b45309]" aria-hidden />
    </div>
    <h2
      id="ai-logic-error-title"
      className="text-center text-[14px] font-semibold leading-normal text-[#111110]"
    >
      Something went wrong
    </h2>
    <p
      id="ai-logic-error-desc"
      className="mx-auto mt-2 max-w-[280px] text-center text-[12.5px] leading-[19.38px] text-[#6b6b68]"
    >
      AI generation failed. This could be a network issue or a temporary problem. You can retry, or
      switch to Manual Logic to set connections yourself.
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#111110] px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2a2a28] cursor-pointer"
      >
        <RiRefreshLine size={12} aria-hidden />
        Retry
      </button>
      <button
        type="button"
        onClick={onSwitchToManual}
        className="rounded-[10px] border border-[#e5e5e2] px-[15px] py-2 text-[12.5px] font-medium text-[#111110] transition-colors hover:bg-[#f4f4f2] cursor-pointer"
      >
        Switch to Manual
      </button>
    </div>
  </div>
);

export default AiLogicGenerationFailedPanel;

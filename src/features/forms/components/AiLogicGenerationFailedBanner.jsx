import { RiErrorWarningFill } from 'react-icons/ri';

/**
 * Figma: Clearform-Changes — AI logic generation failed banner (node 1992:42305).
 */
const AiLogicGenerationFailedBanner = ({
  title = 'Generation failed',
  message = 'Server error (API 429) — please retry.',
  className = '',
}) => (
  <div
    className={`flex shrink-0 items-center gap-[14px] border-b border-[#e7e5e4] bg-[#f5f5f4] px-[18px] py-[14px] pb-[15px] ${className}`}
    role="alert"
  >
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#b45309]"
      aria-hidden
    >
      <RiErrorWarningFill size={14} className="text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[13.5px] font-semibold leading-normal text-[#111110]">{title}</p>
      <p className="mt-[2px] text-[12px] leading-[16.8px] text-[#6b6b68]">{message}</p>
    </div>
  </div>
);

export default AiLogicGenerationFailedBanner;

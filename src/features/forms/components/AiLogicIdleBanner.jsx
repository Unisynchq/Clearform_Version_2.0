import { RiSparklingLine } from 'react-icons/ri';

/**
 * Figma: Clearform-Changes — AI-Driven Logic sticky banner (node 1992:42915).
 * Sticky header on the Logic tab in AI-Driven mode (Generate / re-generate).
 */
const AiLogicIdleBanner = ({
  onGenerate,
  disabled = false,
  className = '',
}) => (
  <div
    className={`flex shrink-0 items-center gap-[14px] border-b border-[#e7e5e4] bg-[#f5f5f4] px-[18px] py-[14px] pb-[15px] ${className}`}
  >
    <div className="min-w-0 flex-1">
      <p className="text-[13.5px] font-semibold leading-normal text-[#111110]">AI-Driven Logic</p>
      <p className="mt-[2px] text-[12px] leading-[16.8px] text-[#6b6b68]">
        AI will analyze your form and automatically map every connection — one click.
      </p>
    </div>
    <button
      type="button"
      onClick={onGenerate}
      disabled={disabled}
      className="inline-flex shrink-0 items-center gap-[6px] rounded-[10px] bg-[#111110] px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2a2a28] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      <RiSparklingLine size={12} aria-hidden />
      Generate Logic
    </button>
  </div>
);

export default AiLogicIdleBanner;

import { RiCheckLine, RiSparklingLine, RiTimeLine } from 'react-icons/ri';

const BADGES = [
  { id: 'duration', label: '~3 sec', Icon: RiTimeLine },
  { id: 'ai', label: 'AI-powered', Icon: RiSparklingLine },
  { id: 'editable', label: 'Editable after', Icon: RiCheckLine },
];

/**
 * Figma: Clearform-Changes — No logic yet center CTA (node 1992:42961).
 * Shown when AI mode is active and logic has not been generated yet.
 */
const AiLogicEmptyPanel = ({ className = '' }) => (
  <div
    className={`relative mx-auto w-full max-w-[340px] rounded-[16px] border border-[#e5e5e2] bg-white px-6 py-7 text-center ${className}`}
  >
    <h2 className="text-[14px] font-semibold leading-normal text-[#111110]">No logic yet</h2>
    <p className="mx-auto mt-2 max-w-[280px] text-[12.5px] leading-[19.38px] text-[#6b6b68]">
      Click <span className="font-semibold text-[#111110]">Generate Logic</span> above and AI will
      instantly map all your screen connections.
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-[6px]">
      {BADGES.map(({ id, label, Icon }) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 rounded-full border border-[#e5e5e2] bg-[#f4f4f2] px-[10px] py-1 text-[11px] font-medium text-[#a0a09c]"
        >
          <Icon size={9} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  </div>
);

export default AiLogicEmptyPanel;

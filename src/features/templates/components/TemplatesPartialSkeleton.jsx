import { LuBriefcase, LuGauge, LuGraduationCap, LuHandshake } from 'react-icons/lu';
import { RiSearchLine } from 'react-icons/ri';

const FILTER_TABS = ['All', 'HR & Recruitment', 'Support', 'Research', 'Education', 'Legal'];

const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]';

/* Static bar — solid #e5e3dc, no shimmer (matches Figma "Background" rects) */
const Bar = ({ className = '', style }) => (
  <div className={`bg-[#e5e3dc] ${className}`} style={style} />
);

/* Animated bar — shimmer overlay (matches Figma "Gradient" rects) */
const ShimmerBar = ({ className = '', style }) => (
  <div className={`bg-[#e5e3dc] ${shimmer} ${className}`} style={style} />
);

/* Skeleton card cell with a real icon and shimmering text lines */
const SkeletonCardCell = ({ Icon, borderRight, borderBottom }) => (
  <div
    className={`bg-white flex gap-[8px] items-start pl-[12px] pr-[13px] pt-[12px] pb-[13px]
      ${borderRight ? 'border-r border-[#e5e3dc]' : ''}
      ${borderBottom ? 'border-b border-[#e5e3dc]' : ''}`}
  >
    {/* Icon tile */}
    <div className="w-[24px] h-[24px] shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-[4px] flex items-center justify-center">
      <Icon size={14} className="text-[#a8a6a0]" />
    </div>

    {/* Text lines */}
    <div className="flex-1 min-w-0 relative h-[55px]">
      <ShimmerBar className="absolute h-[11px] rounded-[3px] top-0 left-0 right-0" />
      <Bar className="absolute h-[8px] rounded-[3px] top-[14px] left-0" style={{ right: 90 }} />
      <Bar className="absolute h-[8px] rounded-[3px] top-[25px] left-0" style={{ right: 203 }} />
      <ShimmerBar className="absolute h-[14px] rounded-[3px] top-[41px] left-0 w-[50px]" />
    </div>
  </div>
);

/* Partial-loading state for the Templates page.
   Page chrome (header, search, filters, banner) is fully rendered;
   only the template card grid shows shimmer placeholders with their icons.
   Matches Figma frame "Templates Loading" (1139:43910). */
const TemplatesPartialSkeleton = () => (
  <div className="bg-white min-h-full w-full">
    <div className="max-w-[1200px] w-full px-[32px] py-[32px]">

      {/* Header */}
      <div className="flex flex-col gap-[8px] mb-[27px]">
        <h1 className="text-[28px] font-semibold text-[#111110] leading-[42px] tracking-[-0.56px]">
          Form Templates
        </h1>
        <p className="text-[15px] font-normal text-[#656565] leading-[24px]">
          Choose from professionally designed templates optimized for high-quality responses and meaningful data collection.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-[27px]">
        <div className="relative flex items-center bg-[#f7f6f3] border border-[#e8e7e2] rounded-[7px]">
          <div className="absolute left-[16px] top-1/2 -translate-y-1/2 pointer-events-none">
            <RiSearchLine size={16} className="text-[#aeada6]" />
          </div>
          <div
            className="w-full bg-transparent pl-[48px] pr-[16px] py-[14px] text-[14px] font-normal text-[#aeada6] leading-[18px]"
            aria-disabled="true"
          >
            Search templates by name, category, or use case...
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-[4px] flex-wrap mb-[27px]">
        {FILTER_TABS.map((tab, i) => (
          <div
            key={tab}
            className={`h-[29px] flex items-center px-[9px] rounded-[999px] text-[10px] font-medium leading-[15px] whitespace-nowrap ${
              i === 0
                ? 'bg-[#1a1a1c] text-white border border-[#1a1a1c]'
                : 'bg-white text-[#6b6966] border border-[#e5e3dc]'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* "Can't find what you need?" banner */}
      <div className="bg-[#f7f6f3] border border-[#e8e7e2] rounded-[12px] px-[25px] py-[25px] mb-[27px] flex items-center justify-between gap-4">
        <div className="flex flex-col gap-[4px]">
          <h3
            className="text-[16px] font-bold text-[#111110] leading-[24px]"
            style={{ fontFamily: 'Arimo, sans-serif' }}
          >
            Can't find what you need?
          </h3>
          <p className="text-[14px] font-normal text-[#656565] leading-[21px]">
            Start from scratch or request a custom template
          </p>
        </div>
        <div className="shrink-0 bg-[#111110] text-white text-[13px] font-medium leading-[19.5px] px-[24px] py-[12px] rounded-[7px] whitespace-nowrap">
          Create Custom Form
        </div>
      </div>

      {/* Skeleton card grid (2x2) with real icons */}
      <div className="border border-[#e5e3dc] rounded-[8px] overflow-hidden">
        <div className="grid grid-cols-2">
          <SkeletonCardCell Icon={LuBriefcase}     borderRight borderBottom />
          <SkeletonCardCell Icon={LuGauge}                     borderBottom />
          <SkeletonCardCell Icon={LuGraduationCap} borderRight />
          <SkeletonCardCell Icon={LuHandshake} />
        </div>
      </div>

    </div>
  </div>
);

export default TemplatesPartialSkeleton;

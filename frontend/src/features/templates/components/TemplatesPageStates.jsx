import { motion } from 'motion/react';
import { RiSearchLine, RiFileAddLine } from 'react-icons/ri';
import { LuFolderOpen, LuBriefcase, LuGauge, LuGraduationCap, LuClipboardList } from 'react-icons/lu';

export const DisabledSearch = () => (
  <div className="bg-[#f4f3ef] border border-[#e5e3dc] flex items-center gap-2 h-[30px] px-[13px] rounded-lg w-full">
    <RiSearchLine size={14} className="text-[#a8a6a0] shrink-0" />
    <span className="text-[11px] font-normal text-[#a8a6a0] leading-[16.5px] truncate">
      Search unavailable
    </span>
  </div>
);

const GreyedCardCell = ({ Icon, borderRight, borderBottom, lineWidths }) => (
  <div
    className={`bg-white flex gap-2 items-start pl-3 pr-[13px] pt-3 pb-[13px]
      ${borderRight ? 'border-r border-[#e5e3dc]' : ''}
      ${borderBottom ? 'border-b border-[#e5e3dc]' : ''}`}
  >
    <div className="w-6 h-6 shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded flex items-center justify-center">
      <Icon size={14} className="text-[#a8a6a0]" />
    </div>
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <div className="bg-[#e5e3dc] h-[11px] rounded-[3px]" style={{ width: lineWidths[0] }} />
      <div className="bg-[#e5e3dc] h-2 rounded-[3px] w-full" />
      <div className="bg-[#e5e3dc] h-[14px] rounded-[3px]" style={{ width: lineWidths[1] }} />
    </div>
  </div>
);

export const GreyedOutGrid = () => (
  <div className="border border-[#e5e3dc] rounded-lg overflow-hidden opacity-25">
    <div className="grid grid-cols-2">
      <GreyedCardCell Icon={LuBriefcase} borderRight borderBottom lineWidths={[103, 50]} />
      <GreyedCardCell Icon={LuGauge} borderBottom lineWidths={[90, 60]} />
      <GreyedCardCell Icon={LuGraduationCap} borderRight lineWidths={[110, 45]} />
      <GreyedCardCell Icon={LuClipboardList} lineWidths={[97, 55]} />
    </div>
  </div>
);

export const EmptyTemplatesBody = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="flex flex-col items-center justify-center w-full h-[465px] px-10 py-8"
  >
    <div className="w-16 h-16 bg-[#f4f3ef] border border-[#e5e3dc] rounded-2xl flex items-center justify-center mb-4">
      <LuFolderOpen size={24} className="text-[#6b6966]" />
    </div>
    <p className="text-[14px] font-medium text-[#1a1a1c] leading-[21px] text-center mb-2">
      No templates available yet
    </p>
    <p className="text-[11px] font-normal text-[#6b6966] leading-[16.5px] text-center max-w-[240px] mb-4">
      Our template library is being updated. Check back soon, or start from scratch.
    </p>
    <button
      type="button"
      className="bg-[#1a1a1c] border border-[#1a1a1c] text-white text-[12px] font-medium leading-none h-7 px-[13px] rounded-lg hover:bg-[#2c2c2e] transition-colors cursor-pointer"
    >
      Create Custom Form
    </button>
  </motion.div>
);

export const EmptyCategoryState = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16"
  >
    <div className="w-12 h-12 bg-[#f4f3ef] border border-[#e5e3dc] rounded-xl flex items-center justify-center mb-4">
      <RiFileAddLine size={16} className="text-[#a8a6a0]" />
    </div>
    <p className="text-[16px] font-medium text-[#1a1a1c] leading-[20.8px] mb-1">
      No templates in this category
    </p>
    <p className="text-[14px] font-normal text-[#6b6966] leading-[21px]">
      Try another category or browse all templates.
    </p>
  </motion.div>
);

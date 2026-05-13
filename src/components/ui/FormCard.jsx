import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { RiFileTextLine, RiCheckLine } from 'react-icons/ri';
import { openContextMenu, openFormOverlay, toggleCompareForm } from '../../redux/slices/uiSlice';
import { formatResponseCount } from '../../constants';

const StatusBadge = ({ status, isTargetReached }) => {
  if (isTargetReached) {
    return (
      <span className="absolute top-2 right-2 px-[7px] py-[2px] rounded-[10px] text-[10px] font-medium tracking-[0.2px] leading-[15px] bg-[#efe9ff] text-[#6d47c6] border border-[#d9cdfc]">
        Target reached
      </span>
    );
  }

  const isLive = status === 'live';
  return (
    <span
      className={`absolute top-2 right-2 px-[7px] py-[2px] rounded-[10px] text-[10px] font-medium tracking-[0.2px] leading-[15px] ${
        isLive
          ? 'bg-[#ebf5ee] text-[#2e7d52]'
          : 'bg-[#f0efe9] border border-[rgba(0,0,0,0.08)] text-[#a09d94]'
      }`}
    >
      {isLive ? 'Live' : 'Draft'}
    </span>
  );
};

const ThumbnailLines = ({ overlayColor }) => (
  <div className="flex flex-col gap-[6px] items-start w-[143px]">
    <div className="h-[5px] rounded-[3px] w-full" style={{ backgroundColor: `${overlayColor}0.2)` }} />
    <div className="h-[14px] rounded-[4px] w-full" style={{ backgroundColor: `${overlayColor}0.12)` }} />
    <div className="h-[5px] rounded-[3px] w-[100px]" style={{ backgroundColor: `${overlayColor}0.2)` }} />
    <div className="h-[14px] rounded-[4px] w-full" style={{ backgroundColor: `${overlayColor}0.12)` }} />
  </div>
);

const FormCard = ({ form }) => {
  const dispatch = useDispatch();
  const compareModeActive = useSelector((s) => s.ui.compareMode.active);
  const selectedFormIds = useSelector((s) => s.ui.compareMode.selectedFormIds);
  const isSelected = selectedFormIds.includes(form.id);
  const isMaxed = selectedFormIds.length >= 2;
  const isDisabled = compareModeActive && isMaxed && !isSelected;
  const isTargetReached = !!form.responseLimit && form.responses >= form.responseLimit;

  const handleMoreClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch(openContextMenu({ formId: form.id, x: rect.left, y: rect.bottom + 4 }));
  };

  const handleClick = () => {
    if (compareModeActive) {
      if (isDisabled) return;
      dispatch(toggleCompareForm(form.id));
    } else {
      dispatch(openFormOverlay(form.id));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isDisabled ? { y: -2, boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.18)' : '0 8px 24px rgba(0,0,0,0.10)' } : {}}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={handleClick}
      className={`bg-white rounded-[14px] overflow-hidden flex flex-col group relative transition-all duration-150 ${
        isDisabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer'
      } ${
        isSelected
          ? 'border-2 border-[#1a1a1c] ring-2 ring-[#1a1a1c]/10'
          : 'border border-[rgba(0,0,0,0.08)]'
      }`}
    >
      {/* Compare mode selection checkmark */}
      {compareModeActive && (
        <div
          className={`absolute top-2 left-2 z-10 size-[18px] rounded-full flex items-center justify-center transition-all duration-150 ${
            isSelected
              ? 'bg-[#1a1a1c] border border-[#1a1a1c]'
              : 'bg-white/80 border border-[rgba(0,0,0,0.2)]'
          }`}
        >
          {isSelected && <RiCheckLine size={11} className="text-white" />}
        </div>
      )}

      {/* Thumbnail */}
      <div
        className="h-[100px] relative flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(140deg, ${form.gradientFrom} 0%, ${form.gradientTo} 100%)` }}
      >
        <ThumbnailLines overlayColor={form.overlayColor} />
        <StatusBadge status={form.status} isTargetReached={isTargetReached} />
      </div>

      {/* Card body */}
      <div className="px-[14px] py-3 flex flex-col gap-[5.5px]">
        <div className="flex items-start justify-between">
          <span className="text-[12.5px] font-medium text-[#1a1916] leading-[16.25px] flex-1 pr-1 truncate">
            {form.title}
          </span>
          {!compareModeActive && (
            <button
              onClick={handleMoreClick}
              className="w-[24px] h-[20px] flex items-center justify-center rounded-[6px] text-[#6b6966] hover:bg-[#f4f3ef] hover:text-[#1a1916] transition-colors text-[16px] font-bold leading-none shrink-0 opacity-0 group-hover:opacity-100"
            >
              ···
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <RiFileTextLine size={11} className={isTargetReached ? 'text-[#6d47c6]' : 'text-[#646464]'} />
            <span className="text-[11px] font-normal text-[#646464] leading-[16.5px]">
              {isTargetReached
                ? `${formatResponseCount(form.responses)}/${formatResponseCount(form.responseLimit)} responses`
                : `${formatResponseCount(form.responses)} ${form.responses === 1 ? 'response' : 'responses'}`}
            </span>
          </div>
          <span className="text-[11px] font-normal leading-[16.5px] text-[#646464]">
            {form.timeAgo}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default FormCard;

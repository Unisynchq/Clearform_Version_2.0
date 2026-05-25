import { useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import { RiMore2Fill } from 'react-icons/ri';
import { openContextMenu, openFormOverlay } from '@/store/slices/uiSlice';
import { formatResponseCount } from '@/constants';
import { isFormPaused } from '../utils/formPause';

const StatusBadge = ({ status, isTargetReached, isPaused }) => {
  if (isPaused) {
    return (
      <span className="inline-flex items-center px-[8px] py-[3px] rounded-[6px] text-[11px] font-medium leading-[15px] bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
        Paused
      </span>
    );
  }

  if (isTargetReached) {
    return (
      <span className="inline-flex items-center px-[8px] py-[3px] rounded-[6px] text-[11px] font-medium leading-[15px] bg-[#efe9ff] text-[#6d47c6] border border-[#d9cdfc]">
        Target reached
      </span>
    );
  }

  const isLive = status === 'live';
  return (
    <span
      className={`inline-flex items-center px-[8px] py-[3px] rounded-[6px] text-[11px] font-medium leading-[15px] ${
        isLive ? 'bg-[#ebf5ee] text-[#2e7d52]' : 'bg-[#fef3cd] text-[#b45309]'
      }`}
    >
      {isLive ? 'Live' : 'Draft'}
    </span>
  );
};

const FormIcon = ({ form }) => (
  <div
    className="w-7 h-7 rounded-[7px] shrink-0 flex items-center justify-center overflow-hidden"
    style={{ background: form.iconGradient }}
  >
    <div className="flex flex-col gap-[3px] w-[14px]">
      <div className="h-[2px] rounded-full w-full" style={{ backgroundColor: `${form.overlayColor}0.35)` }} />
      <div className="h-[5px] rounded-[2px] w-full" style={{ backgroundColor: `${form.overlayColor}0.2)` }} />
      <div className="h-[2px] rounded-full w-3/4" style={{ backgroundColor: `${form.overlayColor}0.35)` }} />
    </div>
  </div>
);

const FormListRow = ({ form, index }) => {
  const dispatch = useDispatch();
  const isTargetReached = !!form.responseLimit && form.responses >= form.responseLimit;
  const isPaused = isFormPaused(form);

  const handleMoreClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch(openContextMenu({ formId: form.id, x: rect.left - 160, y: rect.bottom + 4 }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => dispatch(openFormOverlay(form.id))}
      className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-4 py-[14px] border-b border-[#e5e3dc] last:border-b-0 items-center hover:bg-[#fafaf8] transition-colors cursor-pointer group"
    >
      {/* Form name + icon */}
      <div className="flex items-center gap-3 min-w-0">
        <FormIcon form={form} />
        <span className="text-[13px] font-medium text-[#1a1a1c] leading-[19.5px] truncate">
          {form.title}
        </span>
      </div>

      {/* Status */}
      <div><StatusBadge status={form.status} isTargetReached={isTargetReached} isPaused={isPaused} /></div>

      {/* Responses */}
      <span className={`text-[13px] leading-[19.5px] ${form.responses > 0 ? 'text-[#1a1a1c]' : 'text-[#a8a6a0]'}`}>
        {form.responses > 0
          ? (isTargetReached
                ? `${formatResponseCount(form.responses)}/${formatResponseCount(form.responseLimit)} responses`
            : `${formatResponseCount(form.responses)} ${form.responses === 1 ? 'response' : 'responses'}`)
          : 'No responses yet'}
      </span>

      {/* Last updated */}
      <span className={`text-[13px] leading-[19.5px] ${isTargetReached ? 'text-[#6d47c6]' : 'text-[#a8a6a0]'}`}>
        {isTargetReached ? 'Target reached' : form.timeAgo}
      </span>

      {/* More options */}
      <button
        onClick={handleMoreClick}
        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#f0efe9] transition-all cursor-pointer text-[#6b6966]"
      >
        <RiMore2Fill size={16} />
      </button>
    </motion.div>
  );
};

export default FormListRow;

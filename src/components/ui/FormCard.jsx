import { useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import { RiFileTextLine } from 'react-icons/ri';
import { openContextMenu, openFormOverlay } from '../../redux/slices/uiSlice';
import { formatResponseCount } from '../../constants';

const StatusBadge = ({ status }) => {
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

  const handleMoreClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch(openContextMenu({ formId: form.id, x: rect.left, y: rect.bottom + 4 }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      transition={{ duration: 0.2 }}
      onClick={() => dispatch(openFormOverlay(form.id))}
      className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[14px] overflow-hidden cursor-pointer flex flex-col group"
    >
      {/* Thumbnail */}
      <div
        className="h-[100px] relative flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(140deg, ${form.gradientFrom} 0%, ${form.gradientTo} 100%)` }}
      >
        <ThumbnailLines overlayColor={form.overlayColor} />
        <StatusBadge status={form.status} />
      </div>

      {/* Card body */}
      <div className="px-[14px] py-3 flex flex-col gap-[5.5px]">
        <div className="flex items-start justify-between">
          <span className="text-[12.5px] font-medium text-[#1a1916] leading-[16.25px] flex-1 pr-1 truncate">
            {form.title}
          </span>
          <button
            onClick={handleMoreClick}
            className="w-[22px] h-[17px] flex items-center justify-center rounded-[6px] text-[#6b6966] hover:bg-[#f4f3ef] transition-colors text-[12px] font-medium leading-none shrink-0 opacity-0 group-hover:opacity-100"
          >
            ···
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <RiFileTextLine size={11} className="text-[#646464]" />
            <span className="text-[11px] font-normal text-[#646464] leading-[16.5px]">
              {formatResponseCount(form.responses)} {form.responses === 1 ? 'response' : 'responses'}
            </span>
          </div>
          <span className="text-[11px] font-normal text-[#646464] leading-[16.5px]">
            {form.timeAgo}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default FormCard;

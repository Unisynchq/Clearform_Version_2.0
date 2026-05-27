import { useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import {
  RiAddLine,
  RiLayoutGridLine,
  RiSurveyLine,
  RiBug2Line,
  RiHeartPulseLine,
  RiUserSearchLine,
  RiPhoneLine,
} from 'react-icons/ri';
import { openCreateNewFormModal } from '@/store/slices/uiSlice';

const QUICK_TEMPLATES = [
  { id: 'nps', icon: RiSurveyLine, label: 'NPS Survey' },
  { id: 'bug', icon: RiBug2Line, label: 'Bug Report' },
  { id: 'feedback', icon: RiHeartPulseLine, label: 'Feedback' },
  { id: 'onboarding', icon: RiUserSearchLine, label: 'Onboarding' },
  { id: 'contact', icon: RiPhoneLine, label: 'Contact us' },
];

const NewWorkspaceEmpty = ({ workspaceName = 'Inc Corp' }) => {
  const dispatch = useDispatch();
  return (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 gap-5 text-center"
  >
    {/* Title */}
    <div>
      <h3 className="text-[20px] font-semibold text-[#1a1a1c] leading-[28px] tracking-[-0.3px]">
        Your workspace is ready
      </h3>
      <p className="text-[14px] text-[#6b6966] leading-[21px] mt-1 max-w-[340px]">
        Build from scratch or pick a template to get collecting responses faster. Everything in this
        workspace stays scoped to {workspaceName}.
      </p>
    </div>

    {/* CTAs */}
    <div className="flex items-center gap-3">
      <button
        onClick={() => dispatch(openCreateNewFormModal())}
        className="flex items-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-medium px-[17px] py-[9px] rounded-lg hover:bg-[#2c2c2e] transition-colors cursor-pointer"
      >
        <RiAddLine size={14} />
        Create a form
      </button>
      <button className="flex items-center gap-2 bg-white border border-[#e5e3dc] text-[#1a1a1c] text-[14px] font-medium px-[17px] py-[9px] rounded-lg hover:bg-[#f4f3ef] transition-colors cursor-pointer">
        <RiLayoutGridLine size={14} />
        Add forms
      </button>
    </div>

    {/* Quick-start templates */}
    <div className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-semibold text-[#a8a6a0] tracking-[0.7px] uppercase leading-[15px]">
        Quick start with a template
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#e5e3dc] rounded-[99px] text-[13px] font-medium text-[#1a1a1c] hover:border-[#1a1a1c] hover:bg-[#f4f3ef] transition-all cursor-pointer"
            >
              <Icon size={13} className="text-[#6b6966]" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  </motion.div>
  );
};

export default NewWorkspaceEmpty;

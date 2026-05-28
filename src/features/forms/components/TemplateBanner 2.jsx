import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiLayoutMasonryLine,
  RiCloseLine,
  RiAddLine,
  RiSurveyLine,
  RiHeartPulseLine,
  RiBug2Line,
  RiUserSearchLine,
  RiStarLine,
  RiBarChartLine,
  RiArrowRightCircleLine,
} from 'react-icons/ri';
import { dismissTemplateBanner } from '@/store/slices/formsSlice';
import { openCreateNewFormModal } from '@/store/slices/uiSlice';

/* `filter` maps to the category filter tabs on TemplatesPage */
const TEMPLATES = [
  { id: 'nps',        icon: RiSurveyLine,      label: 'NPS Survey',       sub: 'Customer care', color: '#ebf2fb', iconColor: '#3b82f6', filter: 'Support' },
  { id: 'onboarding', icon: RiHeartPulseLine,  label: 'Onboarding Flow',  sub: 'HR & Ops',      color: '#f0fdf4', iconColor: '#16a34a', filter: 'HR & Recruitment' },
  { id: 'bug',        icon: RiBug2Line,         label: 'Bug Report',       sub: 'Engineering',   color: '#fffbeb', iconColor: '#d97706', filter: 'Support' },
  { id: 'exit',       icon: RiUserSearchLine,   label: 'Exit Interview',   sub: 'HR',            color: '#f0ebfb', iconColor: '#8b5cf6', filter: 'HR & Recruitment' },
  { id: 'product',    icon: RiStarLine,         label: 'Product Feedback', sub: 'Product',       color: '#e8f6f5', iconColor: '#0d9488', filter: 'Research' },
  { id: 'csat',       icon: RiBarChartLine,     label: 'CSAT Survey',      sub: 'Support',       color: '#fdf1ed', iconColor: '#ef4444', filter: 'Support' },
];

const Shimmer = ({ className }) => (
  <div
    className={`relative overflow-hidden bg-[#ece9e3] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] ${className}`}
  />
);

/* Stagger container variants */
const stripVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.18 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

const TemplateBanner = ({ visible, isLoading }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {(visible || isLoading) && (
        <motion.div
          key="template-banner"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="px-6 py-4 overflow-hidden"
        >
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[14px] overflow-hidden">

            {/* Header */}
            <div
              className={`flex items-center justify-between px-[18px] pb-[15px] pt-[14px] transition-colors ${
                expanded ? 'border-b border-[rgba(0,0,0,0.08)]' : ''
              }`}
            >
              <div className="flex items-center gap-[10px]">
                {isLoading ? (
                  <>
                    <Shimmer className="w-[22px] h-[22px] rounded-[6px] shrink-0" />
                    <div className="flex flex-col gap-[5px]">
                      <Shimmer className="h-[14px] w-[130px] rounded-[4px]" />
                      <Shimmer className="h-[11px] w-[210px] rounded-[4px]" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-[22px] h-[22px] bg-[#ebf2fb] rounded-[6px] flex items-center justify-center shrink-0">
                      <RiLayoutMasonryLine size={13} className="text-[#3b82f6]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#1a1916] leading-[18px]">
                        Start from a template
                      </p>
                      <p className="text-[11px] text-[#646464] leading-[16.5px]">
                        {expanded
                          ? 'Viewing as: New user (template strip expanded)'
                          : 'Pick one to get started faster'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-[8px] shrink-0">
                {isLoading ? (
                  <>
                    <Shimmer className="h-[30px] w-[128px] rounded-[8px]" />
                    <Shimmer className="w-[22px] h-[22px] rounded-full" />
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setExpanded((v) => !v)}
                      className="bg-white border border-[#e5e3dc] rounded-[8px] px-[13px] py-[7px] text-[12px] font-medium text-[#1a1a1c] leading-normal hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {expanded ? 'Collapse' : 'View all templates'}
                    </button>
                    <button
                      onClick={() => dispatch(dismissTemplateBanner())}
                      className="w-[22px] h-[22px] border border-[rgba(0,0,0,0.5)] rounded-[11px] flex items-center justify-center hover:bg-[#f4f3ef] transition-colors cursor-pointer shrink-0"
                    >
                      <RiCloseLine size={12} className="text-[#6b6966]" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Template strip */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="strip"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <motion.div
                      className="flex items-stretch"
                      variants={stripVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {/* Blank form */}
                      <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                        onClick={() => dispatch(openCreateNewFormModal())}
                        className="flex flex-col items-center justify-center gap-[8px] px-4 py-5 border-r border-[rgba(0,0,0,0.08)] w-[120px] shrink-0 hover:bg-[#f9f8f7] cursor-pointer relative z-10"
                      >
                        <div className="w-9 h-9 border border-dashed border-[rgba(0,0,0,0.14)] rounded-[9px] flex items-center justify-center">
                          <RiAddLine size={16} className="text-[#6b6960]" />
                        </div>
                        <span className="text-[12px] font-medium text-[#6b6960] leading-[18px]">
                          Blank form
                        </span>
                      </motion.button>

                      {/* Template cards */}
                      {TEMPLATES.map((t) => {
                        const Icon = t.icon;
                        return (
                          <motion.button
                            key={t.id}
                            variants={itemVariants}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                            onClick={() => navigate(`/dashboard/templates?filter=${encodeURIComponent(t.filter)}`)}
                            className="flex-1 flex flex-col gap-[10px] items-start px-4 py-4 border-r border-[rgba(0,0,0,0.08)] hover:bg-[#f9f8f7] cursor-pointer relative z-10 min-w-0"
                          >
                            <div
                              className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                              style={{ background: t.color }}
                            >
                              <Icon size={16} style={{ color: t.iconColor }} />
                            </div>
                            <div className="flex flex-col gap-[2px] items-start w-full">
                              <p className="text-[14px] font-medium text-[#1a1916] leading-[16.25px] truncate w-full text-left">
                                {t.label}
                              </p>
                              <p className="text-[11px] text-[#646464] leading-[16.5px] text-left">
                                {t.sub}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}

                      {/* More */}
                      <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                        onClick={() => navigate('/dashboard/templates')}
                        className="flex flex-col items-center justify-center gap-[8px] px-4 py-4 w-[80px] shrink-0 hover:bg-[#f9f8f7] cursor-pointer relative z-10"
                      >
                        <RiArrowRightCircleLine size={24} className="text-[#6b6966]" />
                        <span className="text-[12px] font-medium text-[#6b6966] leading-[16.25px] text-center">
                          More
                        </span>
                      </motion.button>
                    </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TemplateBanner;

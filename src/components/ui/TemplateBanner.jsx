import { useState } from 'react';
import { useDispatch } from 'react-redux';
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
  RiMore2Fill,
} from 'react-icons/ri';
import { dismissTemplateBanner } from '../../redux/slices/formsSlice';

const TEMPLATES = [
  { id: 'blank', icon: RiAddLine, label: 'Blank form', sub: null, color: '#f4f3ef' },
  { id: 'nps', icon: RiSurveyLine, label: 'NPS Survey', sub: 'Customer care', color: '#eff6ff' },
  { id: 'onboarding', icon: RiHeartPulseLine, label: 'Onboarding Flow', sub: 'HR & Ops', color: '#f0fdf4' },
  { id: 'bug', icon: RiBug2Line, label: 'Bug Report', sub: 'Engineering', color: '#fffbeb' },
  { id: 'exit', icon: RiUserSearchLine, label: 'Exit Interview', sub: 'HR', color: '#f0ebfb' },
  { id: 'product', icon: RiStarLine, label: 'Product Feedback', sub: 'Product', color: '#e8f6f5' },
  { id: 'csat', icon: RiBarChartLine, label: 'CSAT Survey', sub: 'Support', color: '#fdf1ed' },
  { id: 'more', icon: RiMore2Fill, label: 'More', sub: null, color: '#f4f3ef' },
];

const TemplateBanner = ({ visible }) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="px-6 py-4 overflow-hidden"
        >
          <div className="bg-white border border-[#e5e3dc] rounded-[12px] overflow-hidden">
            {/* Collapsed row */}
            <div className="flex items-center gap-4 px-[21px] py-[17px]">
              <div className="w-8 h-8 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg flex items-center justify-center shrink-0">
                <RiLayoutMasonryLine size={16} className="text-[#3b82f6]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#1a1a1c] leading-[19.6px]">
                  Start from a template
                </p>
                {expanded && (
                  <p className="text-[12px] text-[#6b6966] leading-[16.8px]">
                    Viewing as: New user (template strip expanded)
                  </p>
                )}
                {!expanded && (
                  <p className="text-[12px] font-normal text-[#6b6966] leading-[16.8px]">
                    Pick one to get started faster
                  </p>
                )}
              </div>

              <button
                onClick={() => setExpanded((v) => !v)}
                className="bg-white border border-[#e5e3dc] rounded-lg px-[13px] py-[7px] text-[12px] font-medium text-[#1a1a1c] leading-normal hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                View all templates
              </button>

              <button
                onClick={() => {
                  setExpanded(false);
                  dispatch(dismissTemplateBanner());
                }}
                className="w-[22px] h-[22px] border border-[rgba(0,0,0,0.5)] rounded-[11px] flex items-center justify-center hover:bg-[#f4f3ef] transition-colors cursor-pointer shrink-0"
              >
                <RiCloseLine size={12} className="text-[#6b6966]" />
              </button>
            </div>

            {/* Expanded template strip */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-[#e5e3dc] px-4 py-4 overflow-hidden"
                >
                  <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                    {TEMPLATES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          className="flex flex-col items-center gap-2 w-[200px] p-3 rounded-none border border-[#e5e3dc] border-r-0 last:border-r hover:bg-[#f9f8f7] hover:shadow-md hover:z-10 hover:scale-y-110 transition-all cursor-pointer group"
                        >
                          <div
                            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                            style={{ background: t.color }}
                          >
                            <Icon size={18} className="text-[#1a1a1c]" />
                          </div>
                          <span className="text-[12px] font-medium text-[#1a1a1c] leading-[17px] text-center">
                            {t.label}
                          </span>
                          {t.sub && (
                            <span className="text-[10px] text-[#a8a6a0] leading-[14px] text-center">
                              {t.sub}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
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

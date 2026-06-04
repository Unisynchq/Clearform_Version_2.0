import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { RiBarChartLine } from 'react-icons/ri';
import { MAX_COMPARE_FORMS } from '@/constants';
import {
  closeCompareMode,
  toggleCompareForm,
  clearCompareSelection,
  deactivateCompareModeKeepSelection,
} from '@/store/slices/uiSlice';

const WORKSPACE_COLORS = {
  product: '#2563eb',
  hr:      '#22c55e',
  marketing: '#d97706',
};

/* ── Single chip ── */
const FormChip = ({ form, onRemove }) => {
  const wsColor = WORKSPACE_COLORS[form.workspace] ?? '#a8a6a0';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-[7px] px-[11px] py-[7px] bg-[#eae9e6] border border-[rgba(255,255,255,0.1)] rounded-[10px] shrink-0 self-stretch"
      style={{ maxWidth: 160, minWidth: 0 }}
    >
      <div
        className="rounded-[4px] shrink-0"
        style={{ width: 8, height: 8, backgroundColor: wsColor }}
      />
      <span className="text-[12px] font-medium text-black leading-[16px] truncate" style={{ maxWidth: 98 }}>
        {form.title}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(form.id); }}
        className="size-[16px] rounded-[4px] bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 hover:bg-[rgba(0,0,0,0.12)] transition-colors cursor-pointer"
        aria-label={`Remove ${form.title}`}
      >
        <span className="text-[#9ca3af] text-[12px] leading-[12px] font-normal select-none">×</span>
      </button>
    </motion.div>
  );
};

/* ── Dock ── */
const CompareModeDock = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const chipsRef   = useRef(null);
  const { active, selectedFormIds } = useSelector((s) => s.ui.compareMode);
  const allForms = useSelector((s) => s.forms.forms ?? []);

  const selectedForms = selectedFormIds
    .map((id) => allForms.find((f) => f.id === id))
    .filter(Boolean);

  const count      = selectedForms.length;
  const isMaxed    = count >= MAX_COMPARE_FORMS;
  const canCompare = count === MAX_COMPARE_FORMS;

  const handleCompare = () => {
    if (!canCompare || selectedFormIds.length < MAX_COMPARE_FORMS) return;
    const primaryFormId = selectedFormIds[0];
    dispatch(deactivateCompareModeKeepSelection());
    navigate(`/dashboard/analytics?form=${primaryFormId}&tab=compare`);
  };

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300]"
          style={{ width: 'min(calc(100vw - 48px), 860px)', minWidth: 520 }}
        >
          {/* Card */}
          <div className="bg-white rounded-[18px] px-[14px] py-[12px] flex items-center gap-[12px] relative overflow-hidden">

            {/* Floating shadow ring */}
            <div
              className="absolute inset-0 rounded-[18px] pointer-events-none"
              style={{
                boxShadow:
                  '0px 0px 0px 1px rgba(255,255,255,0.07), 0px 8px 16px 0px rgba(0,0,0,0.25), 0px 24px 48px 0px rgba(0,0,0,0.3)',
              }}
            />

            {/* Count label */}
            <div className="shrink-0 flex flex-col gap-[2px]" style={{ width: 64 }}>
              <span className="text-[11px] font-semibold text-[#a5a4a2] tracking-[0.44px] uppercase leading-[14px] whitespace-nowrap">
                {count} selected
              </span>
              {isMaxed && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-medium text-[#d4522a] leading-[13px] whitespace-nowrap"
                >
                  Max reached
                </motion.span>
              )}
            </div>

            {/* Chips — scrollable, no scrollbar */}
            <div className="relative flex-1 min-w-0 self-stretch">
              {/* right fade mask when scrollable */}
              <div
                className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.95))',
                }}
              />
              <div
                ref={chipsRef}
                className="flex gap-[6px] items-stretch h-full"
                style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <AnimatePresence mode="popLayout">
                  {selectedForms.map((form) => (
                    <FormChip
                      key={form.id}
                      form={form}
                      onRemove={(id) => dispatch(toggleCompareForm(id))}
                    />
                  ))}
                </AnimatePresence>

                {count === 0 && (
                  <span className="text-[12px] text-[#a8a6a0] self-center pl-1 whitespace-nowrap">
                    Click form cards to select up to {MAX_COMPARE_FORMS}
                  </span>
                )}
              </div>
            </div>

            {/* Clear all */}
            <AnimatePresence>
              {count > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => dispatch(clearCompareSelection())}
                  className="text-[11px] font-normal text-[#0f0f0e] leading-[14px] px-[6px] py-[4px] rounded-[6px] hover:bg-[#f4f3ef] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Clear all
                </motion.button>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div
              className="shrink-0"
              style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' }}
            />

            {/* Compare CTA */}
            <motion.button
              type="button"
              layout
              whileHover={canCompare ? { scale: 1.02 } : {}}
              whileTap={canCompare ? { scale: 0.97 } : {}}
              disabled={!canCompare}
              onClick={handleCompare}
              className={`flex items-center gap-[7px] px-[18px] py-[10px] rounded-[12px] text-[13px] font-bold text-white leading-[17px] shrink-0 transition-colors whitespace-nowrap ${
                canCompare
                  ? 'bg-black hover:bg-[#1a1a1c] cursor-pointer drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.2)]'
                  : 'bg-[#c7c5c0] cursor-not-allowed'
              }`}
            >
              <RiBarChartLine size={14} className="shrink-0" />
              {count > 0 ? `Compare ${count} form${count !== 1 ? 's' : ''}` : 'Compare forms'} →
            </motion.button>

            {/* Exit compare mode */}
            <button
              onClick={() => dispatch(closeCompareMode())}
              className="size-[28px] flex items-center justify-center rounded-[8px] text-[#a8a6a0] hover:bg-[#f4f3ef] hover:text-[#1a1a1c] transition-colors cursor-pointer shrink-0 text-[20px] leading-none font-light"
              aria-label="Exit compare mode"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompareModeDock;

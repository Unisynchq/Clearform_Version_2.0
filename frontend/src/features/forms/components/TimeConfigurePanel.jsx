import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiArrowDownSLine, RiCloseLine } from 'react-icons/ri';

const TRACK_ON = '#1a1a1a';
const TRACK_OFF = '#d4d4d2';

function FigmaToggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-[36px] h-[20px] rounded-[10px] transition-colors cursor-pointer border-0 p-[2px] flex items-center"
      style={{
        background: checked ? TRACK_ON : TRACK_OFF,
        justifyContent: checked ? 'flex-end' : 'flex-start',
      }}
    >
      <span
        className="bg-white rounded-[8px] shrink-0"
        style={{ width: 16, height: 16, boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.2)' }}
      />
    </button>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-[5px] first:pt-[5px]">
      <span className="text-[12.5px] text-[#1a1a1a]" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
        {label}
      </span>
      <FigmaToggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

function TimeLimitField({ label, value, onChange, showSeconds }) {
  const [focused, setFocused] = useState(false);
  const isEmpty = !value?.trim();
  const step = showSeconds ? 1 : 60;

  return (
    <div className="flex flex-col gap-[6px] pt-[8px] first:pt-[10px]">
      <label className="text-[11.5px] text-[#6b6b6b]" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
        {label}
      </label>
      <div className="relative w-full">
        {isEmpty && !focused && (
          <span
            className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[12.5px] text-[#9a9a9a] pointer-events-none"
            style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}
          >
            No limit
          </span>
        )}
        <input
          type="time"
          step={step}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-white border border-[#e0e0de] rounded-[6px] px-[11px] py-[9px] text-[12.5px] outline-none focus:border-[#111] transition-colors ${
            isEmpty && !focused ? 'text-transparent' : 'text-[#1a1a1a]'
          }`}
          style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}
        />
        {isEmpty && focused && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange('');
              setFocused(false);
            }}
            className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[10px] text-[#888] hover:text-[#111] cursor-pointer px-1"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default function TimeConfigurePanel({
  onClose,
  sections,
  setSections,
  timeRequired,
  setTimeRequired,
  timeUse12h,
  setTimeUse12h,
  timeShowSeconds,
  setTimeShowSeconds,
  timeMinTime,
  setTimeMinTime,
  timeMaxTime,
  setTimeMaxTime,
}) {
  return (
    <div
      className="w-[280px] h-full bg-[#f7f6f4] border border-[rgba(0,0,0,0.09)] flex flex-col overflow-hidden rounded-l-[16px]"
      style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.05), 0px 8px 32px 0px rgba(0,0,0,0.07)' }}
    >
      <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
        <span
          className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Configure
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-[20px] h-[20px] bg-[#f0eeea] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors"
          aria-label="Close configure panel"
        >
          <RiCloseLine size={8} className="text-[#666] shrink-0" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border-b border-[rgba(0,0,0,0.09)]">
        <button
          type="button"
          onClick={() => setSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))}
          className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
        >
          <span
            className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            FIELD SETTINGS
          </span>
          <motion.span
            animate={{ rotate: sections.fieldSettings ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center shrink-0"
          >
            <RiArrowDownSLine size={12} className="text-[#bbb]" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {sections.fieldSettings && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-[14px] pt-[4px]">
                <ToggleRow label="Required" checked={timeRequired} onChange={setTimeRequired} />
                <div className="pt-[10px]">
                  <ToggleRow label="12h format" checked={timeUse12h} onChange={setTimeUse12h} />
                </div>
                <ToggleRow label="Show seconds" checked={timeShowSeconds} onChange={setTimeShowSeconds} />
                <TimeLimitField
                  label="Min time"
                  value={timeMinTime}
                  onChange={setTimeMinTime}
                  showSeconds={timeShowSeconds}
                />
                <TimeLimitField
                  label="Max time"
                  value={timeMaxTime}
                  onChange={setTimeMaxTime}
                  showSeconds={timeShowSeconds}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

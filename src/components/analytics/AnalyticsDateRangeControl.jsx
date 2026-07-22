import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RiArrowDownSLine, RiTimeLine } from 'react-icons/ri';
import CustomRangeDatePicker, { formatCustomRangeLabel } from './CustomRangeDatePicker';
import {
  ANALYTICS_CUSTOM_RANGE_OPTION,
  ANALYTICS_RANGE_OPTIONS,
  isAnalyticsCustomRangeLabel,
} from './analyticsRangeOptions';

/**
 * Preset list + Figma custom range calendar (from / to). Used in analytics header and panels.
 */
export default function AnalyticsDateRangeControl({
  value,
  onChange,
  align = 'right',
  className = '',
  menuWidthClass = 'w-[200px]',
}) {
  const wrapRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [lastCustom, setLastCustom] = useState({ start: null, end: null });

  useEffect(() => {
    if (!menuOpen && !customOpen) return undefined;
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setMenuOpen(false);
        setCustomOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setCustomOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, customOpen]);

  const pickPreset = (opt) => {
    if (opt === ANALYTICS_CUSTOM_RANGE_OPTION) {
      setMenuOpen(false);
      setCustomOpen(true);
      return;
    }
    onChange?.(opt);
    setMenuOpen(false);
    setCustomOpen(false);
  };

  const menuAlign =
    align === 'left' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
      className={`relative shrink-0 py-1 ${className}`}
      ref={wrapRef}
    >
      <button
        type="button"
        onClick={() => {
          if (customOpen) {
            setCustomOpen(false);
            return;
          }
          setMenuOpen((o) => !o);
        }}
        className="flex items-center gap-2 h-8 px-[13px] rounded-[8px] border border-[#e8e6e0] text-[12px] text-[#646464] hover:bg-[#f4f3ef] cursor-pointer max-w-[min(320px,calc(100vw-3rem))]"
        aria-expanded={menuOpen || customOpen}
        aria-haspopup="listbox"
      >
        <RiTimeLine size={17} className="text-[#6b6966] shrink-0" aria-hidden />
        <span className="truncate">{value}</span>
        <RiArrowDownSLine
          size={16}
          className={`text-[#6b6966] shrink-0 transition-transform duration-200 ${
            menuOpen || customOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="range-menu"
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`absolute ${menuAlign} top-[calc(100%+6px)] z-30 ${menuWidthClass} rounded-[12px] border border-[#e8e6e0] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden`}
          >
            {ANALYTICS_RANGE_OPTIONS.map((opt, i) => {
              const selected =
                opt === ANALYTICS_CUSTOM_RANGE_OPTION
                  ? isAnalyticsCustomRangeLabel(value)
                  : opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  role="menuitem"
                  onClick={() => pickPreset(opt)}
                  className={`w-full text-left px-3 py-2 text-[12px] cursor-pointer hover:bg-[#f4f3ef] transition-colors ${
                    i < ANALYTICS_RANGE_OPTIONS.length - 1 ? 'border-b border-[#e8e6e0]' : ''
                  } ${selected ? 'font-medium bg-[#f4f3ef] text-[#1a1a1c]' : 'text-[#393939]'}`}
                >
                  {opt}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {customOpen && (
          <motion.div
            key="custom-picker"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute ${menuAlign} top-[calc(100%+8px)] z-[35] max-w-[calc(100vw-1.5rem)]`}
          >
            <CustomRangeDatePicker
              initialStart={lastCustom.start}
              initialEnd={lastCustom.end}
              onCancel={() => setCustomOpen(false)}
              onApply={({ start, end }) => {
                const label = formatCustomRangeLabel(start, end);
                setLastCustom({ start, end });
                onChange?.(label);
                setCustomOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

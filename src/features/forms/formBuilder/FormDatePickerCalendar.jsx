import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseFormDateValue(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const s = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatFormDateValue(date) {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function monthGridCells(year, month) {
  const first = new Date(year, month, 1);
  const pad = first.getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < pad; i += 1) cells.push(null);
  for (let d = 1; d <= dim; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function clampDayToMonth(year, month, day) {
  const dim = new Date(year, month + 1, 0).getDate();
  return Math.min(day, dim);
}

/** @typedef {'day' | 'month' | 'year'} DatePickerView */

/**
 * Form builder / respondent date calendar — preserves existing card styling;
 * adds month + year pickers and decade paging.
 */
export default function FormDatePickerCalendar({
  value = null,
  onChange,
  accentColor = '#2a9d6e',
  compactLayout = false,
  className = 'mb-5',
}) {
  const selected = useMemo(() => parseFormDateValue(value), [value]);
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const [view, setView] = useState(/** @type {DatePickerView} */ ('day'));
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? today.getMonth());
  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? today.getFullYear());
  const [yearPageStart, setYearPageStart] = useState(() => {
    const y = selected?.getFullYear() ?? today.getFullYear();
    return Math.floor(y / 12) * 12;
  });

  useEffect(() => {
    if (!selected) return;
    setViewMonth(selected.getMonth());
    setViewYear(selected.getFullYear());
    setYearPageStart(Math.floor(selected.getFullYear() / 12) * 12);
  }, [selected?.getTime()]);

  const cells = useMemo(() => monthGridCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const yearPageYears = useMemo(
    () => Array.from({ length: 12 }, (_, i) => yearPageStart + i),
    [yearPageStart],
  );

  const selectDate = useCallback(
    (date) => {
      if (!date) return;
      onChange?.(formatFormDateValue(date));
      setViewMonth(date.getMonth());
      setViewYear(date.getFullYear());
      setView('day');
    },
    [onChange],
  );

  const prevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const nextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const openMonthView = () => setView('month');
  const openYearView = () => {
    setYearPageStart(Math.floor(viewYear / 12) * 12);
    setView('year');
  };

  const pickMonth = (monthIndex) => {
    setViewMonth(monthIndex);
    if (selected) {
      const day = clampDayToMonth(viewYear, monthIndex, selected.getDate());
      onChange?.(formatFormDateValue(new Date(viewYear, monthIndex, day)));
    }
    setView('day');
  };

  const pickYear = (year) => {
    setViewYear(year);
    if (selected) {
      const day = clampDayToMonth(year, viewMonth, selected.getDate());
      onChange?.(formatFormDateValue(new Date(year, viewMonth, day)));
    } else {
      setViewMonth((m) => m);
    }
    setView('month');
  };

  const prevYearPage = () => setYearPageStart((s) => s - 12);
  const nextYearPage = () => setYearPageStart((s) => s + 12);

  const handleHeaderKeyDown = (e) => {
    if (e.key === 'Escape' && view !== 'day') {
      e.preventDefault();
      setView('day');
    }
  };

  const dayTextClass = compactLayout ? 'text-[12px]' : 'text-[13px]';
  const focusRing =
    'outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.35)] focus-visible:ring-offset-1';

  const renderDayGrid = () => (
    <div className="grid grid-cols-7 text-center px-4 py-3 gap-y-1">
      {WEEKDAYS.map((d) => (
        <span key={d} className="text-[10px] text-[#888] pb-1">{d}</span>
      ))}
      {cells.map((date, idx) => {
        if (!date) {
          return <span key={`pad-${idx}`} className={`${dayTextClass} py-1`} aria-hidden />;
        }
        const isSelected = sameDay(date, selected);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return (
          <button
            key={date.toISOString()}
            type="button"
            onClick={() => selectDate(date)}
            aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            aria-pressed={isSelected}
            className={`${dayTextClass} py-1 rounded-full cursor-pointer transition-colors ${focusRing} ${
              isSelected
                ? 'text-white'
                : isWeekend
                  ? 'text-[#ccc] hover:bg-[rgba(0,0,0,0.05)]'
                  : 'text-[#111] hover:bg-[rgba(0,0,0,0.05)]'
            }`}
            style={isSelected ? { backgroundColor: accentColor } : undefined}
          >
            {date.getDate()}
          </button>
        );
      })}
    </div>
  );

  const renderMonthGrid = () => (
    <div className="grid grid-cols-3 gap-1 px-4 py-3">
      {MONTHS_SHORT.map((label, monthIndex) => {
        const isCurrent = monthIndex === viewMonth;
        const isSelectedMonth = selected && selected.getMonth() === monthIndex && selected.getFullYear() === viewYear;
        return (
          <button
            key={label}
            type="button"
            onClick={() => pickMonth(monthIndex)}
            aria-label={MONTHS[monthIndex]}
            aria-pressed={isSelectedMonth}
            className={`${compactLayout ? 'text-[12px]' : 'text-[13px]'} py-2 rounded-[8px] cursor-pointer transition-colors ${focusRing} ${
              isSelectedMonth
                ? 'text-white'
                : isCurrent
                  ? 'text-[#111] bg-[rgba(0,0,0,0.05)]'
                  : 'text-[#111] hover:bg-[rgba(0,0,0,0.05)]'
            }`}
            style={isSelectedMonth ? { backgroundColor: accentColor } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const renderYearGrid = () => (
    <div className="grid grid-cols-3 gap-1 px-4 py-3">
      {yearPageYears.map((year) => {
        const isCurrent = year === viewYear;
        const isSelectedYear = selected && selected.getFullYear() === year;
        return (
          <button
            key={year}
            type="button"
            onClick={() => pickYear(year)}
            aria-label={String(year)}
            aria-pressed={isSelectedYear}
            className={`${compactLayout ? 'text-[12px]' : 'text-[13px]'} py-2 rounded-[8px] cursor-pointer transition-colors ${focusRing} ${
              isSelectedYear
                ? 'text-white'
                : isCurrent
                  ? 'text-[#111] bg-[rgba(0,0,0,0.05)]'
                  : 'text-[#111] hover:bg-[rgba(0,0,0,0.05)]'
            }`}
            style={isSelectedYear ? { backgroundColor: accentColor } : undefined}
          >
            {year}
          </button>
        );
      })}
    </div>
  );

  const headerLabel = view === 'day' ? (
    <div className="flex items-center gap-1 min-w-0">
      <button
        type="button"
        onClick={openMonthView}
        className={`text-[13px] font-medium text-[#111] cursor-pointer hover:opacity-80 truncate ${focusRing} rounded-[4px]`}
        aria-label={`Select month, currently ${MONTHS[viewMonth]}`}
      >
        {MONTHS[viewMonth]}
      </button>
      <button
        type="button"
        onClick={openYearView}
        className={`text-[13px] font-medium text-[#111] cursor-pointer hover:opacity-80 ${focusRing} rounded-[4px]`}
        aria-label={`Select year, currently ${viewYear}`}
      >
        {viewYear}
      </button>
    </div>
  ) : view === 'month' ? (
    <button
      type="button"
      onClick={openYearView}
      className={`text-[13px] font-medium text-[#111] cursor-pointer hover:opacity-80 ${focusRing} rounded-[4px]`}
      aria-label={`Select year, currently ${viewYear}`}
    >
      {viewYear}
    </button>
  ) : (
    <span className="text-[13px] font-medium text-[#111]">
      {yearPageStart} – {yearPageStart + 11}
    </span>
  );

  const showPrev = view === 'day' || view === 'year';
  const showNext = view === 'day' || view === 'year';
  const onPrev = view === 'day' ? prevMonth : prevYearPage;
  const onNext = view === 'day' ? nextMonth : nextYearPage;
  const prevLabel = view === 'day' ? 'Previous month' : 'Previous years';
  const nextLabel = view === 'day' ? 'Next month' : 'Next years';

  return (
    <div
      className={`border border-[rgba(0,0,0,0.12)] rounded-[10px] overflow-hidden ${className}`}
      role="group"
      aria-label="Date picker"
      onKeyDown={handleHeaderKeyDown}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(0,0,0,0.07)]">
        {headerLabel}
        <div className="flex gap-3">
          {showPrev ? (
            <button
              type="button"
              onClick={onPrev}
              aria-label={prevLabel}
              className={`shrink-0 cursor-pointer text-[#888] hover:text-[#111] transition-colors ${focusRing} rounded-[4px]`}
            >
              <RiArrowLeftSLine size={16} aria-hidden />
            </button>
          ) : (
            <span className="w-4 shrink-0" aria-hidden />
          )}
          {showNext ? (
            <button
              type="button"
              onClick={onNext}
              aria-label={nextLabel}
              className={`shrink-0 cursor-pointer text-[#888] hover:text-[#111] transition-colors ${focusRing} rounded-[4px]`}
            >
              <RiArrowRightSLine size={16} aria-hidden />
            </button>
          ) : (
            <span className="w-4 shrink-0" aria-hidden />
          )}
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {view === 'day' && renderDayGrid()}
          {view === 'month' && renderMonthGrid()}
          {view === 'year' && renderYearGrid()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

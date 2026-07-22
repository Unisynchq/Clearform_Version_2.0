import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function beforeDay(a, b) {
  return stripTime(a).getTime() < stripTime(b).getTime();
}

/** Up to 42 cells (6×7), Sunday-first; null = padding. */
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const pad = first.getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function monthTitle(d) {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Figma-aligned custom range picker (node 2286:3579): month header, Su–Sa row, grid, range highlight.
 */
export default function CustomRangeDatePicker({
  initialStart = null,
  initialEnd = null,
  onApply,
  onCancel,
}) {
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => {
    const base = initialStart ? stripTime(initialStart) : stripTime(now);
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const [start, setStart] = useState(() => (initialStart ? stripTime(initialStart) : null));
  const [end, setEnd] = useState(() => (initialEnd ? stripTime(initialEnd) : null));

  const cells = useMemo(() => monthGrid(view.y, view.m), [view.y, view.m]);

  const handleDayClick = useCallback(
    (date) => {
      if (!date) return;
      const d = stripTime(date);
      if (!start || (start && end)) {
        setStart(d);
        setEnd(null);
        return;
      }
      if (beforeDay(d, start)) {
        setStart(d);
        setEnd(null);
        return;
      }
      setEnd(d);
    },
    [start, end],
  );

  const prevMonth = () => {
    setView((v) => {
      const d = new Date(v.y, v.m - 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const nextMonth = () => {
    setView((v) => {
      const d = new Date(v.y, v.m + 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const canApply = Boolean(start && end);
  const rangeLo =
    start && end ? (beforeDay(start, end) ? stripTime(start) : stripTime(end)) : null;
  const rangeHi =
    start && end ? (beforeDay(start, end) ? stripTime(end) : stripTime(start)) : null;

  const getDayButtonClass = (date) => {
    const d = stripTime(date);
    const t = d.getTime();
    const base =
      'relative min-h-[28px] flex w-full max-w-[34px] items-center justify-center text-[12px] font-medium text-[#0a0a0a] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.35)]';

    if (!start) {
      return `${base} rounded-[6px] hover:bg-white/70`;
    }
    if (!end) {
      if (sameDay(d, start)) return `${base} rounded-[6px] bg-[#e9e7e0]`;
      return `${base} rounded-[6px] hover:bg-white/70`;
    }
    const loT = rangeLo.getTime();
    const hiT = rangeHi.getTime();
    if (t < loT || t > hiT) return `${base} rounded-[6px] hover:bg-white/70`;
    if (loT === hiT) return `${base} rounded-[6px] bg-[#e9e7e0]`;
    if (t === loT) return `${base} rounded-l-[6px] bg-[#e9e7e0]`;
    if (t === hiT) return `${base} rounded-r-[6px] bg-[#e9e7e0]`;
    return `${base} rounded-none bg-[#eceae4]`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="w-[min(272px,calc(100vw-24px))] rounded-[8px] border border-[#dedede] bg-[#f7f7f8] px-3.5 pt-3.5 pb-3 shadow-[0px_4px_3px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.1)]"
      role="dialog"
      aria-label="Select a date range"
    >
      <h2 className="text-center text-[14px] font-medium leading-snug text-[#0a0a0a]">
        Select a date range
      </h2>
      <p className="mt-0.5 text-center text-[10px] leading-snug text-[#4a5565]">
        {start && !end
          ? 'Select end date'
          : !start
            ? 'Select start date'
            : 'Tap dates to adjust range'}
      </p>

      <motion.div className="mt-2.5 flex items-center justify-between gap-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[#0a0a0a] hover:bg-white/80 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.35)]"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <RiArrowLeftSLine size={16} />
        </motion.button>
        <div className="min-w-0 flex-1 text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`${view.y}-${view.m}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="truncate text-[13px] font-semibold leading-snug text-[#0a0a0a]"
            >
              {monthTitle(new Date(view.y, view.m, 1))}
            </motion.p>
          </AnimatePresence>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[#0a0a0a] hover:bg-white/80 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.35)]"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <RiArrowRightSLine size={16} />
        </motion.button>
      </motion.div>

      <div className="mt-2 grid grid-cols-7 gap-y-0.5">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="flex h-6 items-center justify-center text-[10px] font-normal text-[#4a5565]"
          >
            {w}
          </div>
        ))}
        {cells.map((date, idx) => (
          <div key={idx} className="flex min-h-[28px] items-stretch justify-center">
            {date ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 550, damping: 32 }}
                onClick={() => handleDayClick(date)}
                className={`${getDayButtonClass(date)} cursor-pointer`}
              >
                {date.getDate()}
              </motion.button>
            ) : (
              <span className="min-h-[28px] w-full max-w-[34px]" aria-hidden />
            )}
          </div>
        ))}
      </div>

      <motion.div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5 border-t border-[#dedede] pt-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-[#6b6860] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <motion.button
          type="button"
          disabled={!canApply}
          whileTap={canApply ? { scale: 0.98 } : {}}
          onClick={() => canApply && onApply?.({ start: rangeLo, end: rangeHi })}
          className="rounded-[6px] bg-[#17160e] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#2c2c2e] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-opacity"
        >
          Apply
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function formatCustomRangeLabel(start, end) {
  const lo = beforeDay(start, end) ? stripTime(start) : stripTime(end);
  const hi = beforeDay(start, end) ? stripTime(end) : stripTime(start);
  const y1 = lo.getFullYear();
  const y2 = hi.getFullYear();
  const m1 = lo.toLocaleString('en-US', { month: 'short' });
  const m2 = hi.toLocaleString('en-US', { month: 'short' });
  const d1 = lo.getDate();
  const d2 = hi.getDate();
  if (y1 === y2) return `${m1} ${d1} – ${m2} ${d2}, ${y1}`;
  return `${m1} ${d1}, ${y1} – ${m2} ${d2}, ${y2}`;
}

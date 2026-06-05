/** Shared presentational pieces for FormOverlayModal. */

/** Format seconds as `1m 42s` or `45s` for overview KPIs. */
export function formatDurationSeconds(totalSec) {
  if (totalSec == null || Number.isNaN(Number(totalSec))) return '—';
  const sec = Math.round(Number(totalSec));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export const StatCard = ({ label, value, sub, subNeutral, note }) => (
  <div className="bg-[#fafaf8] border border-[#e8e6e0] rounded-[10px] p-[11px] flex flex-col gap-[3px] flex-1">
    <p className="text-[10px] font-normal text-[#737373] leading-normal">{label}</p>
    <p className="text-[22px] font-bold text-[#1a1a1a] leading-tight">{value}</p>
    {sub ? (
      <p className="text-[9.5px] font-normal text-[#16a34a] leading-normal">↑ {sub}</p>
    ) : null}
    {subNeutral ? (
      <p className="text-[9.5px] font-normal text-[#737373] leading-normal">{subNeutral}</p>
    ) : null}
    <div className="h-px bg-[#e8e6e0] w-full my-[2px]" />
    {note ? (
      <p className="text-[10px] font-normal text-[#5b21b6] leading-normal">{note}</p>
    ) : null}
  </div>
);

export const ProgressRing = ({ pct }) => {
  const r = 23;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="62" height="62" className="block -rotate-90">
      <circle cx="31" cy="31" r={r} strokeWidth="8" stroke="#ede7ff" fill="none" />
      <circle
        cx="31"
        cy="31"
        r={r}
        strokeWidth="8"
        stroke="#7c3aed"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

export const PillRow = ({ text }) => (
  <div className="bg-white border border-[rgba(0,0,0,0.05)] rounded-[10px] px-[8px] py-[4px] w-full flex items-center justify-center">
    <p className="text-[12px] font-medium text-[#737373] leading-[19.5px] whitespace-nowrap">{text}</p>
  </div>
);

export const PAUSE_OPTIONS = [
  { id: '1hr', label: 'For 1 hr' },
  { id: '8hrs', label: 'For 8 hrs' },
  { id: '24hrs', label: 'For 24 hrs' },
  { id: 'indefinite', label: 'Until I turn it back on' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function formatTimeRemaining(pauseSettings) {
  if (!pauseSettings?.confirmed) return null;
  const { pauseType, endTimestamp } = pauseSettings;
  if (pauseType === 'permanent' || pauseType === 'indefinite' || !endTimestamp) return null;
  const ms = endTimestamp - Date.now();
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  const minutes = totalMinutes % 60;
  if (totalHours > 0) return `${totalHours}h ${minutes}m`;
  return `${minutes}m`;
}

export function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, type: 'prev' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: 'cur' });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, type: 'next' });
  return cells;
}

/** Tab order for directional panel transitions in FormOverlayModal. */
export const FORM_OVERLAY_TAB_ORDER = ['overview', 'quickSettings'];

export const FORM_OVERLAY_TAB_SPRING = { type: 'spring', stiffness: 380, damping: 34, mass: 0.88 };

export const FORM_OVERLAY_TAB_PANEL_VARIANTS = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 16 : -16,
    scale: 0.988,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -12 : 12,
    scale: 0.992,
  }),
};

export const FORM_OVERLAY_TAB_PANEL_TRANSITION = {
  opacity: { duration: 0.24, ease: [0.25, 0.1, 0.25, 1] },
  x: FORM_OVERLAY_TAB_SPRING,
  scale: FORM_OVERLAY_TAB_SPRING,
};

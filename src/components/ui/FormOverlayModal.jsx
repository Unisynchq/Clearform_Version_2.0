import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiEditLine, RiBarChartLine, RiCloseLine, RiSparklingLine,
  RiCalendarLine, RiErrorWarningLine, RiCheckLine,
  RiArrowLeftSLine, RiArrowRightSLine, RiEarthLine,
} from 'react-icons/ri';
import { closeFormOverlay } from '../../redux/slices/uiSlice';
import { pauseFormThunk, unpauseFormThunk, fetchAnalyticsThunk } from '../../redux/slices/formsSlice';

/* ── KPI stat card ──
   sub        = green ↑ trend line  (e.g. "5% this week")
   subNeutral = gray  ~ neutral line (e.g. "~ same")
*/
const StatCard = ({ label, value, sub, subNeutral, note }) => (
  <div className="bg-[#fafaf8] border border-[#e8e6e0] rounded-[10px] p-[11px] flex flex-col gap-[3px] flex-1">
    <p className="text-[10px] font-normal text-[#737373] leading-normal">{label}</p>
    <p className="text-[22px] font-bold text-[#1a1a1a] leading-tight">{value}</p>
    {sub && (
      <p className="text-[9.5px] font-normal text-[#16a34a] leading-normal">↑ {sub}</p>
    )}
    {subNeutral && (
      <p className="text-[9.5px] font-normal text-[#737373] leading-normal">{subNeutral}</p>
    )}
    <div className="h-px bg-[#e8e6e0] w-full my-[2px]" />
    {note && (
      <p className="text-[10px] font-normal text-[#5b21b6] leading-normal">✦ {note}</p>
    )}
  </div>
);

/* ── Progress ring ── */
const ProgressRing = ({ pct }) => {
  const r = 21;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="56" height="56" className="-rotate-90">
      <circle cx="28" cy="28" r={r} strokeWidth="6" stroke="#e8e6e0" fill="none" />
      <circle
        cx="28" cy="28" r={r}
        strokeWidth="6" stroke="#7c3aed" fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

/* ── White pill row at bottom of lower cards ── */
const PillRow = ({ text }) => (
  <div className="bg-white border border-[rgba(0,0,0,0.05)] rounded-[10px] px-[8px] py-[4px] w-full flex items-center justify-center">
    <p className="text-[12px] font-medium text-[#737373] leading-[19.5px] whitespace-nowrap">{text}</p>
  </div>
);

const PAUSE_OPTIONS = [
  { id: '1hr',        label: 'For 1 hr' },
  { id: '8hrs',       label: 'For 8 hrs' },
  { id: '24hrs',      label: 'For 24 hrs' },
  { id: 'indefinite', label: 'Until I turn it back on' },
];

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, type: 'prev' });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, type: 'cur' });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++)
    cells.push({ day: d, type: 'next' });
  return cells;
}

const FormOverlayModal = () => {
  const dispatch = useDispatch();
  const { open, formId } = useSelector((s) => s.ui.formOverlay);
  const form = useSelector((s) => s.forms.forms.find((f) => f.id === formId));
  const [activeTab, setActiveTab]             = useState('overview');
  const [responseLimit, setResponseLimit]     = useState('500');
  const [selectedPause, setSelectedPause]     = useState(null);
  const [notificationsOn, setNotificationsOn] = useState(false);
  // date-time picker state (local only — persisted to Redux on confirm)
  const [viewYear, setViewYear]   = useState(2026);
  const [viewMonth, setViewMonth] = useState(4);   // 0-indexed; 4 = May
  const [selDay, setSelDay]       = useState(17);
  const [hour, setHour]           = useState('09');
  const [minute, setMinute]       = useState('00');
  const [ampm, setAmpm]           = useState('AM');

  // confirmed pause comes from Redux so it survives close/reopen
  const confirmedPause = form?.pauseSettings?.confirmed ?? false;
  const pauseEndLabel  = form?.pauseSettings?.endLabel  ?? '';

  // Reset UI/picker state only when a *different* form is opened
  const prevFormIdRef = useRef(null);
  useEffect(() => {
    if (!formId) return;
    if (formId === prevFormIdRef.current) return;   // same form reopened — keep state
    prevFormIdRef.current = formId;

    // Genuinely different form: reset UI state
    setActiveTab('overview');
    setResponseLimit('500');
    setSelectedPause(null);
    setNotificationsOn(false);

    dispatch(fetchAnalyticsThunk(formId));

    // Restore picker to saved pause date if one exists, otherwise reset defaults
    const saved = form?.pauseSettings;
    if (saved) {
      setViewYear(saved.viewYear);
      setViewMonth(saved.viewMonth);
      setSelDay(saved.selDay);
    } else {
      setViewYear(2026);
      setViewMonth(4);
      setSelDay(17);
      setHour('09');
      setMinute('00');
      setAmpm('AM');
    }
  }, [formId]); // eslint-disable-line react-hooks/exhaustive-deps

  const calCells    = buildCalendarGrid(viewYear, viewMonth);
  const resumeLabel = `${MONTH_NAMES[viewMonth].slice(0,3)} ${selDay} · ${hour}:${minute} ${ampm} IST`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  if (!form) return null;

  const completionPct = form.responses > 0 ? Math.round((form.responses / 500) * 100) : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => dispatch(closeFormOverlay())}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          {/* Panel — matches Figma: w-574px */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[16px] shadow-[0px_20px_60px_rgba(0,0,0,0.2)] w-[574px] overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-[#e5e3dc]">
              {/* Form icon */}
              <div
                className="w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center"
                style={{ background: form.iconGradient }}
              >
                <div className="flex flex-col gap-[3px] w-[16px]">
                  <div className="h-[2px] rounded-full w-full"  style={{ backgroundColor: `${form.overlayColor}0.35)` }} />
                  <div className="h-[5px] rounded-[2px] w-full" style={{ backgroundColor: `${form.overlayColor}0.2)` }} />
                  <div className="h-[2px] rounded-full w-3/4"   style={{ backgroundColor: `${form.overlayColor}0.35)` }} />
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px]">
                  {form.title}
                </p>
                <div className="flex items-center gap-2 mt-[3px]">
                  <span className="flex items-center gap-1 text-[12px] font-medium text-[#2e7d52]">
                    <span className="w-[6px] h-[6px] rounded-full bg-[#2e7d52] shrink-0" />
                    {form.status === 'live' ? 'Live' : 'Draft'}
                  </span>
                  <span className="text-[12px] text-[#6b6966] capitalize">{form.workspace}</span>
                  <span className="text-[12px] text-[#a8a6a0]">Updated {form.timeAgo}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-[#1a1a1c] border border-[#e5e3dc] rounded-[7px] hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap">
                  <RiEditLine size={12} />
                  Edit form
                </button>
                <button className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-white bg-[#1a1a1c] rounded-[7px] hover:bg-[#2c2c2e] transition-colors cursor-pointer whitespace-nowrap">
                  <RiBarChartLine size={12} />
                  View analytics
                </button>
              </div>

              {/* Close */}
              <button
                onClick={() => dispatch(closeFormOverlay())}
                className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-[#f4f3ef] text-[#6b6966] transition-colors cursor-pointer shrink-0 mt-[1px]"
              >
                <RiCloseLine size={15} />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 px-5 border-b border-[#e5e3dc]">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'quickSettings', label: 'Quick Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-[12px] font-medium py-[8px] px-1 mr-3 border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#7c3aed] text-[#393939]'
                      : 'border-transparent text-[#747474] hover:text-[#393939]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Overview content ── */}
            {activeTab === 'overview' && (
              <div className="px-[16px] py-[14px] flex flex-col gap-[10px] items-center">

                {/* KPI row */}
                <div className="flex gap-[16px] items-start w-full">
                  <StatCard
                    label="Responses"
                    value={form.responses}
                    sub={form.responses > 0 ? '5% this week' : undefined}
                    note={form.responses > 0 ? 'On target' : undefined}
                  />
                  <StatCard
                    label="Completion rate"
                    value={form.responses > 0 ? '38%' : '—'}
                    sub={form.responses > 0 ? '4% vs last week' : undefined}
                    note={form.responses > 0 ? 'On target' : undefined}
                  />
                  <StatCard
                    label="Avg. time"
                    value={form.responses > 0 ? '1m 42s' : '—'}
                    subNeutral={form.responses > 0 ? '~ same' : undefined}
                    note={form.responses > 0 ? 'On target' : undefined}
                  />
                </div>

                {/* Survey Target + Live Since row */}
                <div className="flex gap-[10px] items-stretch w-full">

                  {/* Survey Target card */}
                  <div className="bg-[#fafaf8] border border-[rgba(0,0,0,0.05)] rounded-[10px] p-[12px] flex flex-col gap-[10px] flex-1">
                    <div className="flex items-center gap-[24px]">
                      <div className="flex flex-col gap-[3px] w-[94px]">
                        <p className="text-[13px] font-medium text-[#1a1814] leading-[19px]">Survey Target</p>
                        <p className="text-[11px] font-medium text-[#737373] leading-[17px] whitespace-nowrap">
                          {form.responses} of 500 filled
                        </p>
                      </div>
                      <div className="relative shrink-0">
                        <ProgressRing pct={completionPct} />
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#1a1814]">
                          {completionPct}%
                        </span>
                      </div>
                    </div>
                    <PillRow text={`${Math.max(0, 500 - form.responses)} more responses needed`} />
                  </div>

                  {/* Live Since card */}
                  <div className="bg-[#fafaf8] border border-[rgba(0,0,0,0.05)] rounded-[10px] p-[12px] flex flex-col gap-[10px] flex-1">
                    <div className="flex items-center gap-[24px] justify-center">
                      <div className="flex flex-col gap-[3px] w-[94px]">
                        <p className="text-[13px] font-medium text-[#1a1814] leading-[19px]">Live Since</p>
                        <p className="text-[11px] font-medium text-[#737373] leading-[17px] whitespace-nowrap">
                          2 March 2026
                        </p>
                      </div>
                      {/* 7 Days badge */}
                      <div
                        className="bg-[#f6f1ff] rounded-[10px] overflow-hidden shrink-0 w-[56px] h-[56px] flex items-end justify-center pb-[8px]"
                        style={{ borderTop: '10px solid #897dff' }}
                      >
                        <span className="text-[11px] font-semibold text-[#1a1814] leading-normal">
                          7 Days
                        </span>
                      </div>
                    </div>
                    <PillRow text="Est. 12 more days to meet target" />
                  </div>

                </div>

                {/* AI insight */}
                <div className="bg-[#f5f3ff] border border-[#e0daff] rounded-[12px] p-[13px] flex flex-col gap-[10px] w-full">
                  <p className="text-[12.1px] font-normal text-[#374151] leading-[20.8px]">
                    <span className="font-bold">✦ </span>
                    {form.analytics?.insight || 'Analyzing sentiment and completion metrics...'}
                  </p>
                  <div className="flex items-center gap-[8px]">
                    <button className="flex items-center gap-1.5 bg-[#6366f1] text-white text-[12px] font-medium px-4 py-[7px] rounded-[8px] hover:bg-[#4f46e5] transition-colors cursor-pointer">
                      <RiSparklingLine size={12} />
                      Improve with AI
                    </button>
                    <button className="bg-white text-[12px] font-medium text-[#1a1a1c] px-4 py-[7px] rounded-[8px] border border-[#e5e3dc] hover:bg-[#f4f3ef] transition-colors cursor-pointer">
                      Dismiss
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ── Quick Settings content ── */}
            {activeTab === 'quickSettings' && (
              <div className={`px-[20px] py-[14px] flex flex-col gap-[7px] ${selectedPause === 'custom' ? 'max-h-[70vh] overflow-y-auto' : ''}`}>

                {/* ── Response limit ── */}
                <div className="bg-[#fafaf8] border border-[#e8e6e0] rounded-[10px] p-[13px] flex items-center justify-between">
                  <div className="flex flex-col gap-[2px]">
                    <p className="text-[12px] font-medium text-black leading-normal">Response limit</p>
                    <p className="text-[10px] font-normal text-[#5f5f5f] leading-normal">
                      Use this to limit the number of responses.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={responseLimit}
                    onChange={(e) => setResponseLimit(e.target.value)}
                    className="bg-[#f0eee9] border border-[#e5e2da] rounded-[8px] px-[11px] py-[7px] w-[88px] text-[12px] text-[#1a1916] text-center font-normal outline-none focus:border-[#7c3aed] transition-colors"
                  />
                </div>

                {/* ── Pause responses card (or Responses paused active state) ── */}
                {confirmedPause ? (
                  /* ── Responses paused: active state ── */
                  <div className="bg-white border border-[#c6f0d8] rounded-[14px] px-[16px] py-[13px] flex flex-col gap-[10px]">

                    {/* Top row: status + buttons */}
                    <div className="flex items-start justify-between gap-[8px]">
                      <div className="flex flex-col gap-[3px]">
                        {/* "Responses paused" heading */}
                        <div className="flex items-center gap-[7px]">
                          <span className="w-[16px] h-[16px] rounded-full bg-[#16a34a] flex items-center justify-center shrink-0">
                            <RiCheckLine size={10} className="text-white" />
                          </span>
                          <p className="text-[13px] font-semibold text-[#16a34a] leading-normal">Responses paused</p>
                        </div>
                        {/* Subtitle */}
                        <p className="text-[11px] font-normal text-[#6b7280] leading-normal pl-[23px]">
                          Until {pauseEndLabel}
                        </p>
                      </div>
                      {/* Buttons */}
                      <div className="flex items-center gap-[6px] shrink-0">
                        <button
                          onClick={() => { dispatch(unpauseFormThunk(formId)); setSelectedPause('custom'); }}
                          className="flex items-center gap-[4px] px-[10px] py-[5px] text-[11.5px] font-medium text-[#1a1a1c] border border-[#e5e3dc] rounded-[7px] bg-white hover:bg-[#f4f3ef] transition-colors cursor-pointer"
                        >
                          <RiEditLine size={11} />
                          Edit
                        </button>
                        <button
                          onClick={() => dispatch(unpauseFormThunk(formId))}
                          className="px-[10px] py-[5px] text-[11.5px] font-semibold text-white bg-[#16a34a] rounded-[7px] hover:bg-[#15803d] transition-colors cursor-pointer"
                        >
                          Resume now
                        </button>
                      </div>
                    </div>

                    {/* Progress timeline */}
                    <div className="flex flex-col gap-[5px]">
                      <div className="h-[5px] w-full bg-[#dcfce7] rounded-full overflow-hidden">
                        <div className="h-full w-[12%] bg-[#16a34a] rounded-full" />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-[#6b7280]">May 1 (today)</p>
                        <p className="text-[10px] font-medium text-[#16a34a]">
                          {`${MONTH_NAMES[viewMonth].slice(0,3)} ${selDay} (resume)`}
                        </p>
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[9px] px-[12px] py-[9px] flex items-start gap-[7px]">
                      <span className="w-[14px] h-[14px] rounded-full border-2 border-[#16a34a] flex items-center justify-center shrink-0 mt-px">
                        <span className="w-[2px] h-[5px] bg-[#16a34a] rounded-full" />
                      </span>
                      <p className="text-[11px] font-normal text-[#15803d] leading-[17px]">
                        New submissions are blocked until the pause ends. Existing responses are safe and unaffected.
                      </p>
                    </div>

                  </div>
                ) : (

                <div className="bg-[#fafaf8] border border-[#ededea] rounded-[14px] px-[16px] py-[13px] flex flex-col gap-[10px]">
                  {/* Title + description */}
                  <div>
                    <p className="text-[13.5px] font-semibold text-[#1a1a1a] leading-normal">Pause responses</p>
                    <p className="text-[12px] font-normal text-[#888] leading-[18px] mt-[2px]">
                      {selectedPause === 'custom'
                        ? 'Pick the exact date and time you\'d like responses to resume.'
                        : 'Temporarily or permanently stop accepting new responses.'}
                    </p>
                  </div>

                  {/* Pills */}
                  <div className="flex flex-col gap-[8px]">
                    {/* Row 1 */}
                    <div className="flex items-center flex-wrap">
                      {PAUSE_OPTIONS.map((opt, i) => (
                        <div key={opt.id} className="flex items-center">
                          {i === 3 && <div className="w-px h-[18px] bg-[#e8e8e4] mx-[7px] shrink-0" />}
                          <button
                            onClick={() => setSelectedPause(selectedPause === opt.id ? null : opt.id)}
                            className={`flex items-center px-[15px] py-[7px] rounded-[100px] text-[12.5px] font-medium transition-all cursor-pointer whitespace-nowrap mr-[8px] last:mr-0 ${
                              selectedPause === opt.id
                                ? 'bg-[#1a1a1a] text-white border border-[#1a1a1a]'
                                : selectedPause === 'custom'
                                  ? 'bg-white border border-[#ededea] text-[#555] opacity-45'
                                  : 'bg-white border border-[#ededea] text-[#555] hover:border-[#c8c8c2]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Row 2 */}
                    <div className="flex items-center">
                      <button
                        onClick={() => setSelectedPause(selectedPause === 'custom' ? null : 'custom')}
                        className={`flex items-center gap-[5px] px-[15px] py-[7px] rounded-[100px] text-[12.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          selectedPause === 'custom'
                            ? 'bg-[#1a1a1a] text-white border border-[#1a1a1a]'
                            : 'bg-white border border-dashed border-[#c8c8c2] text-[#666] hover:border-[#a0a09a]'
                        }`}
                      >
                        <RiCalendarLine size={12} />
                        Custom
                      </button>
                      <div className="w-px h-[18px] bg-[#e8e8e4] mx-[8px] shrink-0" />
                      <button
                        onClick={() => setSelectedPause(selectedPause === 'permanent' ? null : 'permanent')}
                        className={`flex items-center px-[15px] py-[7px] rounded-[100px] text-[12.5px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                          selectedPause === 'permanent'
                            ? 'bg-[#c0392b] text-white border border-[#c0392b]'
                            : selectedPause === 'custom'
                              ? 'bg-[#fff5f5] border border-[#fadadd] text-[#c0392b] opacity-45'
                              : 'bg-[#fff5f5] border border-[#fadadd] text-[#c0392b] hover:bg-[#ffe8e8]'
                        }`}
                      >
                        Close permanently
                      </button>
                    </div>
                  </div>

                  {/* ── Inline date/time picker (Custom only) ── */}
                  {selectedPause === 'custom' && (
                    <div className="border-t border-[#ededea] pt-[14px] flex flex-col gap-[14px]">
                      {/* Picker header */}
                      <div className="flex items-center justify-between">
                        <p className="text-[12.5px] font-semibold text-[#1a1a1a]">Set resume date &amp; time</p>
                        <p className="text-[11px] font-normal text-[#aaa]">{resumeLabel}</p>
                      </div>

                      {/* Calendar + Time side-by-side */}
                      <div className="grid grid-cols-2 gap-[14px]">

                        {/* ── Left: Calendar ── */}
                        <div className="flex flex-col gap-[8px]">
                          {/* Month nav */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={prevMonth}
                              className="w-[24px] h-[24px] flex items-center justify-center border border-[#ededea] rounded-[6px] bg-white hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            >
                              <RiArrowLeftSLine size={11} className="text-[#555]" />
                            </button>
                            <p className="text-[12.5px] font-semibold text-[#1a1a1a]">
                              {MONTH_NAMES[viewMonth]} {viewYear}
                            </p>
                            <button
                              onClick={nextMonth}
                              className="w-[24px] h-[24px] flex items-center justify-center border border-[#ededea] rounded-[6px] bg-white hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            >
                              <RiArrowRightSLine size={11} className="text-[#555]" />
                            </button>
                          </div>

                          {/* Day grid */}
                          <div className="grid grid-cols-7 gap-px">
                            {/* Day headers */}
                            {DAY_HEADERS.map(d => (
                              <div key={d} className="flex items-center justify-center pb-[5px] pt-[2px]">
                                <span className="text-[9.5px] font-semibold text-[#bbb] tracking-[0.38px]">{d}</span>
                              </div>
                            ))}
                            {/* Date cells */}
                            {calCells.map((cell, idx) => {
                              const isSelected = cell.type === 'cur' && cell.day === selDay;
                              const isPrev     = cell.type !== 'cur';
                              return (
                                <button
                                  key={idx}
                                  onClick={() => cell.type === 'cur' && setSelDay(cell.day)}
                                  className={`flex items-center justify-center py-[3.5px] px-px rounded-[6px] cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-[#1a1a1a] rounded-[13px]'
                                      : isPrev
                                        ? 'cursor-default'
                                        : 'hover:bg-[#f2f2f0]'
                                  }`}
                                >
                                  <span className={`text-[11.5px] text-center leading-[16.1px] ${
                                    isSelected ? 'font-medium text-white'
                                    : isPrev   ? 'font-normal text-[#ccc]'
                                               : 'font-normal text-[#333]'
                                  }`}>
                                    {cell.day}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* ── Right: Time + Timezone ── */}
                        <div className="flex flex-col gap-[12px]">

                          {/* RESUME AT */}
                          <div className="flex flex-col gap-[8px]">
                            <p className="text-[10px] font-semibold text-[#aaa] tracking-[0.7px] uppercase">RESUME AT</p>
                            <div className="flex items-center gap-[6px]">
                              {/* Hour */}
                              <div className="flex flex-col gap-[3px] items-center flex-1">
                                <input
                                  type="text"
                                  value={hour}
                                  maxLength={2}
                                  onChange={e => setHour(e.target.value.replace(/\D/g,'').slice(0,2))}
                                  className="w-full border border-[#1a1a1a] rounded-[9px] px-[5px] py-[8px] text-[15px] font-semibold text-[#1a1a1a] text-center outline-none bg-white"
                                />
                                <span className="text-[9.5px] font-medium text-[#aaa]">Hour</span>
                              </div>
                              {/* Colon */}
                              <span className="text-[16px] font-normal text-[#ccc] pb-[14px]">:</span>
                              {/* Minute */}
                              <div className="flex flex-col gap-[3px] items-center flex-1">
                                <input
                                  type="text"
                                  value={minute}
                                  maxLength={2}
                                  onChange={e => setMinute(e.target.value.replace(/\D/g,'').slice(0,2))}
                                  className="w-full border border-[#ededea] rounded-[9px] px-[5px] py-[8px] text-[15px] font-semibold text-[#1a1a1a] text-center outline-none bg-[#fafaf8]"
                                />
                                <span className="text-[9.5px] font-medium text-[#aaa]">Min</span>
                              </div>
                              {/* AM / PM toggle */}
                              <div className="flex flex-col gap-[3px]">
                                {['AM','PM'].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setAmpm(p)}
                                    className={`px-[10px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer transition-colors ${
                                      ampm === p
                                        ? 'bg-[#1a1a1a] text-white border border-[#1a1a1a]'
                                        : 'bg-[#fafaf8] text-[#888] border border-[#ededea] hover:bg-[#f4f3ef]'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* TIMEZONE */}
                          <div className="flex flex-col gap-[8px]">
                            <p className="text-[10px] font-semibold text-[#aaa] tracking-[0.7px] uppercase">TIMEZONE</p>
                            <div className="bg-[#fafaf8] border border-[#ededea] rounded-[8px] px-[11px] py-[8px] flex items-center gap-[7px]">
                              <RiEarthLine size={12} className="text-[#555] shrink-0" />
                              <span className="flex-1 text-[11.5px] font-normal text-[#555]">IST (UTC +5:30)</span>
                              <RiArrowRightSLine size={12} className="text-[#aaa] shrink-0" />
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Picker footer */}
                      <div className="border-t border-[#ededea] pt-[14px] flex items-center justify-end gap-[7px]">
                        <button
                          onClick={() => setSelectedPause(null)}
                          className="bg-white border border-[#e4e4e0] rounded-[8px] px-[14px] py-[7px] text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const label = `${MONTH_NAMES[viewMonth]} ${selDay}, ${viewYear} at ${hour}:${minute} ${ampm} IST`;
                            dispatch(pauseFormThunk({ formId, pauseSettings: { confirmed: true, endLabel: label, viewYear, viewMonth, selDay } }));
                            setSelectedPause(null);
                          }}
                          className="bg-[#1a1a1a] border border-[#1a1a1a] rounded-[8px] px-[14px] py-[7px] text-[12px] font-medium text-white flex items-center gap-[5px] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                        >
                          <RiCheckLine size={13} />
                          Confirm pause
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Warning banner (shown when custom picker is NOT open) */}
                  {selectedPause !== 'custom' && (
                    <div className="bg-[#fff9ec] border border-[#f5e6b8] rounded-[9px] px-[14px] py-[10px] flex items-start gap-[8px]">
                      <RiErrorWarningLine size={14} className="text-[#9a6a00] shrink-0 mt-px" />
                      <p className="text-[11.5px] font-normal text-[#9a6a00] leading-[17.25px]">
                        {`Pausing won't delete existing responses. You can resume anytime from this panel.`}
                      </p>
                    </div>
                  )}
                </div>
                )}{/* end confirmedPause conditional */}

                {/* ── New responses alert ── */}
                <div className="bg-[#fafaf8] border border-[#e8e6e0] rounded-[10px] p-[13px] flex items-center justify-between">
                  <div className="flex flex-col gap-[2px]">
                    <p className="text-[12px] font-medium text-black leading-normal">New responses alert</p>
                    <p className="text-[10px] font-normal text-[#5f5f5f] leading-normal">
                      Notifies you every time a new response is filled.
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => setNotificationsOn((v) => !v)}
                    className={`relative shrink-0 h-[19px] w-[34px] rounded-[10px] transition-colors cursor-pointer ${
                      notificationsOn ? 'bg-[#7c3aed]' : 'bg-[#e5e2da]'
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] size-[15px] bg-white rounded-[7.5px] transition-all duration-200 ${
                        notificationsOn ? 'left-[17px]' : 'left-[2px]'
                      }`}
                    />
                  </button>
                </div>

              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FormOverlayModal;

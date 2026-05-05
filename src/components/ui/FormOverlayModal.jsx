import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiEditLine, RiBarChartLine, RiCloseLine, RiSparklingLine,
  RiCalendarLine, RiErrorWarningLine, RiCheckLine,
  RiArrowLeftSLine, RiArrowRightSLine, RiEarthLine,
  RiPauseLine, RiPlayLine, RiRocketLine, RiEmotionSadLine, RiFileCopyLine,
  RiPencilLine, RiEyeLine, RiArchiveLine,
} from 'react-icons/ri';
import { closeFormOverlay } from '../../redux/slices/uiSlice';
import { setFormPause, clearFormPause, unarchiveForm } from '../../redux/slices/formsSlice';
import { formatResponseCount } from '../../constants';

/* ── Skeleton shimmer helper ── */
const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]';
const S = ({ className = '' }) => (
  <div className={`bg-[#e5e3dc] ${shimmer} ${className}`} />
);

/* ── Form overview skeleton (shown while form data loads) ── */
const FormOverlayModalSkeleton = () => (
  <div className="bg-white border border-[#e5e3dc] rounded-[16px] w-[574px] overflow-hidden">
    {/* Header */}
    <div className="bg-[#f4f3ef] border-b border-[#e5e3dc] px-[20px] pt-[20px] pb-[17px]">
      <div className="flex items-start justify-between">
        {/* Left: icon + title + meta */}
        <div className="flex items-start gap-[16px]">
          <S className="w-[35px] h-[37px] rounded-[4px] shrink-0" />
          <div className="flex flex-col gap-[4px]">
            <S className="w-[196px] h-[19px] rounded-[4px]" />
            <div className="flex items-center gap-[8px] mt-[4px]">
              <S className="w-[53px] h-[9px] rounded-[4px]" />
              <span className="text-[#ddd] text-[12px]">·</span>
              <S className="w-[51px] h-[9px] rounded-[4px]" />
              <span className="text-[#ddd] text-[12px]">·</span>
              <S className="w-[74px] h-[9px] rounded-[4px]" />
            </div>
          </div>
        </div>
        {/* Right: action buttons */}
        <div className="flex items-center gap-[8px] shrink-0">
          <S className="w-[80px] h-[36px] rounded-[4px]" />
          <S className="w-[100px] h-[36px] rounded-[4px]" />
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div className="border-b border-[#e5e3dc] px-[24px] py-[12px] flex items-center justify-center gap-[20px]">
      <S className="w-[74px] h-[9px] rounded-[4px]" />
      <S className="w-[74px] h-[9px] rounded-[4px]" />
    </div>

    {/* Content */}
    <div className="px-[24px] py-[20px] flex flex-col gap-[16px]">
      {/* KPI row — 3 stat cards */}
      <div className="grid grid-cols-3 gap-[12px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] px-[17px] py-[13px] flex flex-col gap-[8px]"
          >
            <S className="w-[74px] h-[9px] rounded-[4px]" />
            <S className="w-[54px] h-[26px] rounded-[4px]" />
          </div>
        ))}
      </div>

      {/* Survey target + Live since row */}
      <div className="grid grid-cols-2 gap-[12px]">
        {/* Survey target */}
        <div className="bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] p-[17px] flex flex-col gap-[12px]">
          <S className="w-[135px] h-[11px] rounded-[4px]" />
          <div className="flex items-center gap-[12px]">
            <S className="w-[52px] h-[52px] rounded-full shrink-0" />
            <div className="flex flex-col gap-[6px] flex-1 min-w-0">
              <S className="w-full h-[5px] rounded-[4px]" />
              <S className="w-[97px] h-[9px] rounded-[4px]" />
            </div>
          </div>
        </div>
        {/* Live since */}
        <div className="bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] p-[17px] flex flex-col gap-[12px]">
          <S className="w-[135px] h-[11px] rounded-[4px]" />
          <div className="flex items-center gap-[12px]">
            <S className="w-[52px] h-[52px] rounded-[12px] shrink-0" />
            <S className="flex-1 h-[36px] rounded-[4px] min-w-0" />
          </div>
        </div>
      </div>

      {/* AI insight block */}
      <S className="w-full h-[64px] rounded-[12px]" />
    </div>
  </div>
);

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
      <p className="text-[10px] font-normal text-[#5b21b6] leading-normal">{note}</p>
    )}
  </div>
);

/* ── Progress ring (62×62 outer, 8px stroke) ── */
const ProgressRing = ({ pct }) => {
  const r = 23;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="62" height="62" className="block -rotate-90">
      <circle cx="31" cy="31" r={r} strokeWidth="8" stroke="#ede7ff" fill="none" />
      <circle
        cx="31" cy="31" r={r}
        strokeWidth="8" stroke="#7c3aed" fill="none"
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

function formatTimeRemaining(pauseSettings) {
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
  const [isLoading, setIsLoading]             = useState(false);
  const [activeTab, setActiveTab]             = useState('overview');
  const [responseLimit, setResponseLimit]     = useState('500');
  const [selectedPause, setSelectedPause]     = useState(null);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [fetchError, setFetchError]           = useState(false);
  const [aiInsightDismissed, setAiInsightDismissed] = useState(false);
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
  const timeRemaining  = formatTimeRemaining(form?.pauseSettings);
  const pauseType      = form?.pauseSettings?.pauseType ?? null;

  // Reset UI/picker state only when a *different* form is opened
  const prevFormIdRef = useRef(null);
  useEffect(() => {
    if (!formId) return;
    if (formId === prevFormIdRef.current) return;   // same form reopened — keep state
    prevFormIdRef.current = formId;

    // Show skeleton briefly to simulate data loading
    setIsLoading(true);
    setFetchError(false);
    const timer = setTimeout(() => {
      setIsLoading(false);
      // ~25% chance of simulated fetch failure (only for live forms with data)
      if (form?.responses > 0 && form?.status === 'live' && !form?.pauseSettings?.confirmed && Math.random() < 0.25) {
        setFetchError(true);
      }
    }, 700);

    // Genuinely different form: reset UI state
    setActiveTab('overview');
    setResponseLimit(String(form?.responseLimit ?? 500));
    setSelectedPause(null);
    setNotificationsOn(false);
    setAiInsightDismissed(false);

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

    return () => clearTimeout(timer);
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

  const completionPct = form && form.responses > 0 ? Math.round((form.responses / 500) * 100) : 0;
  const limitNum      = parseInt(responseLimit) || 0;
  const limitReached  = limitNum > 0 && !!form && form.responses >= limitNum;
  const limitPct      = limitNum > 0 && !!form ? Math.min(100, Math.round((form.responses / limitNum) * 100)) : 0;
  const nearLimit     = limitNum > 0 && !!form && !limitReached && limitPct >= 75;
  const remaining     = limitNum > 0 && !!form ? Math.max(0, limitNum - form.responses) : 0;
  const avgRate       = form?.daysActive ? (form.responses / form.daysActive).toFixed(1) : null;
  const daysToTarget  = avgRate && remaining > 0 ? Math.round(remaining / parseFloat(avgRate)) : null;

  const handleRetry = () => {
    setFetchError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 700);
  };

  const handleConfirmPause = () => {
    if (!selectedPause || selectedPause === 'custom') return;
    let endTimestamp = null;
    let endLabel = '';
    const now = Date.now();
    if (selectedPause === '1hr') {
      endTimestamp = now + 3600000;
      endLabel = new Date(endTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    } else if (selectedPause === '8hrs') {
      endTimestamp = now + 8 * 3600000;
      endLabel = new Date(endTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    } else if (selectedPause === '24hrs') {
      endTimestamp = now + 24 * 3600000;
      endLabel = new Date(endTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    } else if (selectedPause === 'indefinite') {
      endLabel = 'until manually resumed';
    } else if (selectedPause === 'permanent') {
      endLabel = 'permanently';
    }
    dispatch(setFormPause({ formId, endLabel, endTimestamp, pauseType: selectedPause, viewYear, viewMonth, selDay, hour, minute, ampm }));
    setSelectedPause(null);
  };

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

          {/* Skeleton — shown for the initial load of each form */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0px_24px_64px_rgba(0,0,0,0.2),0px_8px_24px_rgba(0,0,0,0.1)]"
            >
              <FormOverlayModalSkeleton />
            </motion.div>
          )}

          {/* Panel — matches Figma: w-574px */}
          {form && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[16px] shadow-[0px_20px_60px_rgba(0,0,0,0.2)] w-[574px] overflow-hidden flex flex-col max-h-[calc(100vh-48px)]"
          >
            {/* ── Draft layout ── */}
            {form.status === 'draft' && !confirmedPause ? (
              <div className="flex flex-col" style={{ minHeight: '380px' }}>

                {/* Draft header */}
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[#f0ede8]">
                  <div className="w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center bg-[#f0ede8]">
                    <RiRocketLine size={18} className="text-[#6b6966]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px]" title={form.title}>
                      {form.title.length > 15 ? form.title.slice(0, 15).trimEnd() + '…' : form.title}
                    </p>
                    <div className="flex items-center gap-2 mt-[3px]">
                      <span className="text-[10.7px] text-[#888]">Draft</span>
                      <span className="text-[11px] text-[#d4d2cc] leading-none">·</span>
                      <span className="text-[11.1px] text-[#888] capitalize">{form.workspace}</span>
                      <span className="text-[11px] text-[#d4d2cc] leading-none">·</span>
                      <span className="text-[11.1px] text-[#767676]">Updated {form.timeAgo}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(closeFormOverlay())}
                    className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#f4f3ef] text-[#6b6966] transition-colors cursor-pointer shrink-0"
                  >
                    <RiCloseLine size={16} />
                  </button>
                </div>

                {/* Draft body */}
                <div className="flex-1 flex flex-col items-center justify-center gap-[4px] py-[48px] px-[24px]">
                  <div className="w-[48px] h-[40px] bg-[#f0ede8] rounded-[10px] flex items-center justify-center mb-[12px]">
                    <RiPencilLine size={22} className="text-[#555]" />
                  </div>
                  <p className="text-[13.2px] font-semibold text-[#555] leading-normal text-center">
                    This form is still a draft
                  </p>
                  <p className="text-[12px] text-[#888] leading-[19.5px] text-center max-w-[370px] mt-[2px]">
                    Publish your form to start collecting responses and see performance data here.
                  </p>
                </div>

                {/* Draft footer */}
                <div className="border-t border-[#f0ede8] flex items-center justify-center gap-[8px] px-[20px] pb-[16px] pt-[17px]">
                  <button className="flex items-center gap-[4px] bg-[#1a1a1c] text-white text-[12px] font-medium h-[36px] px-[13px] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer whitespace-nowrap">
                    <RiPencilLine size={14} />
                    Finish &amp; Publish
                  </button>
                  <button className="flex items-center gap-[4px] bg-white text-[#333] text-[12.4px] font-medium h-[36px] px-[13px] rounded-[8px] border border-[#e0ddd8] hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap">
                    <RiEyeLine size={14} />
                    Preview
                  </button>
                </div>

              </div>
            ) : (
            <>
            {/* ── Header ── */}
            <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-[#e5e3dc]">
              {/* Form icon */}
              <div
                className={`w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center ${form.status === 'archived' && !confirmedPause ? 'border border-[#e5e3dc]' : ''}`}
                style={{
                  background: confirmedPause
                    ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                    : form.status === 'archived'
                      ? '#f4f3ef'
                      : form.responses === 0
                        ? '#f0ede8'
                        : form.iconGradient,
                }}
              >
                {confirmedPause ? (
                  <RiPauseLine size={18} className="text-[#92400e]" />
                ) : form.status === 'archived' ? (
                  <RiArchiveLine size={18} className="text-[#6b6966]" />
                ) : form.responses === 0 ? (
                  <RiRocketLine size={18} className="text-[#6b6966]" />
                ) : (
                  <div className="flex flex-col gap-[3px] w-[16px]">
                    <div className="h-[2px] rounded-full w-full"  style={{ backgroundColor: `${form.overlayColor}0.35)` }} />
                    <div className="h-[5px] rounded-[2px] w-full" style={{ backgroundColor: `${form.overlayColor}0.2)` }} />
                    <div className="h-[2px] rounded-full w-3/4"   style={{ backgroundColor: `${form.overlayColor}0.35)` }} />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#1a1a1c] leading-[22px]" title={form.title}>
                  {form.title.length > 15 ? form.title.slice(0, 15).trimEnd() + '…' : form.title}
                </p>
                <div className="flex items-center gap-2 mt-[3px]">
                  {confirmedPause ? (
                    <span className="flex items-center gap-1 text-[12px] font-medium text-[#c2410c]">
                      <span className="w-[6px] h-[6px] rounded-full bg-[#c2410c] shrink-0" />
                      {pauseType === 'permanent'
                        ? 'Paused permanently'
                        : timeRemaining
                          ? `Paused — resumes in ${timeRemaining}`
                          : pauseType === 'indefinite'
                            ? 'Paused — resumes when you turn it on'
                            : pauseEndLabel
                              ? `Paused — resumes ${pauseEndLabel}`
                              : 'Paused'}
                    </span>
                  ) : form.status === 'archived' ? (
                    <span className="inline-flex items-center bg-[#f8f9fa] border border-[#e5e3dc] rounded-full px-[9px] py-[2px] text-[10px] font-semibold text-[#6b6966] leading-[15px]">
                      Archived
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[12px] font-medium text-[#2e7d52]">
                      <span className="w-[6px] h-[6px] rounded-full bg-[#2e7d52] shrink-0" />
                      {form.status === 'live' ? 'Live' : 'Draft'}
                    </span>
                  )}
                  {!confirmedPause && (
                    <>
                      <span className="text-[12px] text-[#d4d2cc] leading-none">·</span>
                      <span className="text-[12px] text-[#6b6966] capitalize">{form.workspace}</span>
                      <span className="text-[12px] text-[#d4d2cc] leading-none">·</span>
                      <span className="text-[12px] text-[#a8a6a0]">Updated {form.timeAgo}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-[#1a1a1c] border border-[rgba(0,0,0,0.1)] rounded-[8px] hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap">
                  <RiEditLine size={12} />
                  Edit form
                </button>
                {confirmedPause ? (
                  <button
                    onClick={() => dispatch(clearFormPause(formId))}
                    className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-white bg-[#1a1a1c] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RiPlayLine size={12} />
                    Resume Form
                  </button>
                ) : form.status === 'archived' ? (
                  <button
                    onClick={() => dispatch(unarchiveForm(formId))}
                    className="flex items-center px-3 py-[6px] text-[12px] font-medium text-white bg-[#1a1a1c] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Unarchive
                  </button>
                ) : (
                  <button className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-white bg-[#1a1a1c] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer whitespace-nowrap">
                    <RiBarChartLine size={12} />
                    View analytics
                  </button>
                )}
              </div>

            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center justify-center gap-1 px-5 border-b border-[#e5e3dc]">
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

            {/* ── Scrollable content area ── */}
            <div className="flex-1 overflow-y-auto">

            {/* ── Overview content ── */}
            {activeTab === 'overview' && form.responses === 0 && !confirmedPause && form.status !== 'archived' && (
              <div className="flex flex-col items-center gap-[8px] py-[52px] px-[24px]">
                {/* Sad face icon */}
                <div className="w-[48px] h-[40px] bg-[#f0ede8] rounded-[10px] flex items-center justify-center mb-[8px]">
                  <RiEmotionSadLine size={22} className="text-[#6b6966]" />
                </div>
                {/* Heading */}
                <p className="text-[14px] font-semibold text-[#1a1a1c] leading-[21px] text-center">
                  No responses yet
                </p>
                {/* Subtitle */}
                <p className="text-[12px] text-[#6b6966] leading-[19.2px] text-center max-w-[280px] mb-[4px]">
                  Your form is live. Share the link to start collecting responses and see analytics here.
                </p>
                {/* CTA buttons */}
                <div className="flex flex-col items-center gap-[6px] w-[220px]">
                  <button className="w-full flex items-center justify-center gap-[6px] bg-[#1a1a1c] text-white text-[13px] font-medium h-[34px] px-[17px] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer">
                    <RiFileCopyLine size={13} />
                    Copy form link
                  </button>
                  <button className="w-full flex items-center justify-center text-[12px] font-medium text-[#6b6966] h-[28px] px-[13px] rounded-[8px] hover:text-[#1a1a1c] transition-colors cursor-pointer">
                    Share via email
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (form.responses > 0 || confirmedPause || form.status === 'archived') && (
              <div className="px-[16px] py-[14px] flex flex-col gap-[10px] items-center">

                {/* Fetch error banner */}
                {fetchError && !confirmedPause && form.status !== 'archived' && (
                  <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-[17px] py-[13px] flex items-start gap-[8px] w-full">
                    <RiErrorWarningLine size={14} className="text-[#991b1b] shrink-0 mt-[2px]" />
                    <div className="flex flex-col gap-[10px]">
                      <p className="text-[12px] text-[#991b1b] leading-[18.6px]">
                        <strong>Failed to load analytics</strong>
                        {' — your form is still live and collecting responses.'}
                      </p>
                      <div className="flex items-center gap-[8px]">
                        <button
                          onClick={handleRetry}
                          className="bg-white border border-[#e5e3dc] text-[12px] font-medium text-[#1a1a1c] h-[28px] px-[13px] rounded-[8px] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
                        >
                          Try again
                        </button>
                        <button className="text-[12px] font-medium text-[#6b6966] h-[28px] px-[13px] rounded-[8px] hover:text-[#1a1a1c] transition-colors cursor-pointer">
                          Open full analytics →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Archived info banner */}
                {form.status === 'archived' && !confirmedPause && (
                  <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-[17px] py-[13px] flex items-start gap-[8px] w-full">
                    <RiArchiveLine size={14} className="text-[#1e40af] shrink-0 mt-[2px]" />
                    <p className="text-[12px] text-[#1e40af] leading-[18.6px]">
                      This form is archived and no longer accepting responses.
                    </p>
                  </div>
                )}

                {/* Paused warning banner */}
                {confirmedPause && (
                  <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] px-[17px] py-[13px] flex items-start gap-[8px] w-full">
                    <RiPauseLine size={14} className="text-[#92400e] shrink-0 mt-[2px]" />
                    <p className="text-[12px] text-[#92400e] leading-[18.6px]">
                      {'Form is paused. '}
                      <strong>No new responses</strong>
                      {' are being accepted. '}
                      {timeRemaining ? (
                        <>Resumes automatically in <strong>{timeRemaining}</strong>.</>
                      ) : pauseType === 'indefinite' ? (
                        'Paused until you manually resume it.'
                      ) : pauseType === 'permanent' ? (
                        'This form is permanently closed.'
                      ) : pauseEndLabel ? (
                        <>Resumes on <strong>{pauseEndLabel}</strong>.</>
                      ) : null}
                    </p>
                  </div>
                )}

                {/* KPI row */}
                <div className={`flex gap-[16px] items-start w-[calc(100%-15px)] transition-opacity ${confirmedPause || form.status === 'archived' || fetchError ? 'opacity-40 pointer-events-none' : ''}`}>
                  <StatCard
                    label="Responses"
                    value={formatResponseCount(form.responses)}
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

                {/* Stale data note — shown only on fetch error */}
                {fetchError && !confirmedPause && form.status !== 'archived' && (
                  <p className="text-[10px] text-[#777] text-center w-full leading-[15px]">
                    Showing data from last successful load · {form.timeAgo}
                  </p>
                )}

                {/* Survey Target + Live Since row — hidden when paused, archived, or fetch error */}
                <div className={`flex gap-[10px] items-stretch w-[calc(100%-10px)] ${confirmedPause || form.status === 'archived' || fetchError ? 'hidden' : ''}`}>

                  {/* Survey Target card — matches Figma node 1138:29677 */}
                  <div className="bg-[#fafaf8] border border-[rgba(0,0,0,0.05)] rounded-[10px] p-[16px] flex flex-col gap-[16px] justify-between flex-1">
                    <div className="flex items-center justify-between gap-[12px]">
                      <div className="flex flex-col gap-[4px] min-w-0 pl-[4px]">
                        <p className="text-[14px] font-medium text-[#1a1814] leading-[19.5px]">Survey Target</p>
                        <p className="text-[12px] font-medium text-[#737373] leading-[19.5px] whitespace-nowrap">
                          {form.responses} of 500 filled
                        </p>
                      </div>
                      <div className="relative w-[62px] h-[62px] shrink-0">
                        <ProgressRing pct={completionPct} />
                        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold leading-none tabular-nums text-[#1a1814]">
                          {completionPct}%
                        </span>
                      </div>
                    </div>
                    <PillRow text={`${Math.max(0, 500 - form.responses)} more responses needed`} />
                  </div>

                  {/* Live Since card — paddings/gaps mirrored to keep the row aligned with Survey Target */}
                  <div className="bg-[#fafaf8] border border-[rgba(0,0,0,0.05)] rounded-[10px] p-[16px] flex flex-col gap-[16px] justify-between flex-1">
                    <div className="flex items-center justify-between gap-[12px]">
                      <div className="flex flex-col gap-[4px] min-w-0 pl-[4px]">
                        <p className="text-[14px] font-medium text-[#1a1814] leading-[19.5px]">Live Since</p>
                        <p className="text-[12px] font-medium text-[#737373] leading-[19.5px] whitespace-nowrap">
                          2 March 2026
                        </p>
                      </div>
                      {/* 7 Days badge — sized to match the 64×64 progress ring */}
                      <div
                        className="bg-[#f6f1ff] rounded-[10px] overflow-hidden shrink-0 w-[64px] h-[64px] flex items-end justify-center pb-[10px]"
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

                {/* AI insight — hidden when paused, archived, fetch error, or dismissed */}
                {!confirmedPause && form.status !== 'archived' && !fetchError && !aiInsightDismissed && (
                  <div className="bg-[#f5f3ff] border border-[#e0daff] rounded-[12px] p-[13px] flex flex-col gap-[10px] w-[calc(100%-5px)]">
                    <p className="text-[12.1px] font-normal text-[#374151] leading-[20.8px]">
                      Sentiment positive, completion above benchmark — but Step 3 is losing 28% of respondents. Improve it to gain ~30 more completions.
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <button className="flex items-center gap-1.5 bg-[#6366f1] text-white text-[12px] font-medium px-4 py-[7px] rounded-[8px] hover:bg-[#4f46e5] transition-colors cursor-pointer">
                        <RiSparklingLine size={12} />
                        Improve with AI
                      </button>
                      <button
                        onClick={() => setAiInsightDismissed(true)}
                        className="bg-white text-[12px] font-medium text-[#1a1a1c] px-4 py-[7px] rounded-[8px] border border-[#e5e3dc] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ── Quick Settings content ── */}
            {activeTab === 'quickSettings' && (
              <div className="px-[16px] py-[16px] flex flex-col gap-[10px]">

                {/* ── Response limit ── */}
                <div className="bg-[#fdfcfb] border border-[#ede9e3] rounded-[12px] px-[17px] py-[15px] flex items-center justify-between">
                  <div className="flex flex-col gap-[2px]">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] leading-normal">Response limit</p>
                    <p className="text-[11.5px] font-normal text-[#9a9590] leading-normal">
                      Use this to limit the number of responses.
                    </p>
                  </div>
                  {limitReached ? (
                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] px-[15px] py-[7px] text-[13px] font-semibold text-[#16a34a] text-center min-w-[68px]">
                      {responseLimit}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={responseLimit}
                      onChange={(e) => setResponseLimit(e.target.value)}
                      className="bg-[#f0eee9] border border-[#e5e2da] rounded-[8px] px-[11px] py-[7px] w-[88px] text-[12px] text-[#1a1916] text-center font-normal outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  )}
                </div>

                {/* ── Celebration block (response limit reached) ── */}
                {limitReached && !confirmedPause && (
                  <div
                    className="border border-[#86efac] rounded-[12px] px-[17px] py-[15px] flex flex-col gap-[10px] w-full overflow-hidden"
                    style={{ background: 'linear-gradient(134.57deg, #f0fdf4 0%, #ecfdf5 100%)' }}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between w-full">
                      <p className="text-[14px] font-bold text-[#14532d] leading-normal">Response target reached!</p>
                      <button
                        onClick={() => setResponseLimit(String(limitNum + 500))}
                        className="bg-[#16a34a] text-white text-[11.5px] font-semibold px-[11px] py-[6px] rounded-[8px] hover:bg-[#15803d] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        ↑ Raise limit
                      </button>
                    </div>

                    {/* Subtitle */}
                    <p className="text-[12px] font-medium text-[#16a34a] leading-normal">
                      {form.responses} out of {limitNum} responses collected · Form is now paused
                    </p>

                    {/* Stat pills */}
                    <div className="flex gap-[8px] flex-wrap">
                      {[
                        { value: String(form.responses), label: 'Responses' },
                        { value: '100%', label: 'Target hit' },
                        { value: form.daysActive ? `${form.daysActive} days` : '—', label: 'To complete' },
                        { value: avgRate ? `${avgRate} / day` : '—', label: 'Avg. rate' },
                      ].map(({ value, label }) => (
                        <div key={label} className="bg-white border border-[#bbf7d0] rounded-[8px] px-[13px] py-[8px] flex flex-col gap-px">
                          <p className="text-[15px] font-bold text-[#14532d] leading-[15px]">{value}</p>
                          <p className="text-[10px] font-medium text-[#6b9e7a] leading-normal">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-[6px] pt-[2px]">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-semibold text-[#16a34a]">{form.responses} responses</span>
                        <span className="text-[11px] font-semibold text-[#16a34a]">✓ Limit reached</span>
                      </div>
                      <div className="bg-[#bbf7d0] rounded-[20px] h-[7px] w-full overflow-hidden">
                        <div className="bg-[#16a34a] h-full w-full rounded-[20px]" />
                      </div>
                      <div className="flex items-center justify-between w-full pb-[4px]">
                        <span className="text-[10.5px] font-normal text-[#6b9e7a]">
                          {form.startedDate ? `${form.startedDate} (started)` : 'Started'}
                        </span>
                        <span className="text-[10.5px] font-normal text-[#6b9e7a]">
                          {form.completedDate ? `${form.completedDate} (completed)` : 'Completed'}
                        </span>
                      </div>
                    </div>

                    {/* Info box */}
                    <div className="bg-[rgba(255,255,255,0.8)] border border-[#bbf7d0] rounded-[8px] px-[12px] py-[10px]">
                      <p className="text-[11.5px] text-[#44403c] leading-[17.25px]">
                        <strong>New submissions are paused.</strong>
                        <span className="font-normal text-[#78716c]">
                          {` All ${form.responses} responses are safe. Raise the limit to keep collecting, or export your data now.`}
                        </span>
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-[6px]">
                      <button className="bg-[#16a34a] text-white text-[11.5px] font-semibold px-[11px] py-[5.5px] rounded-[8px] hover:bg-[#15803d] transition-colors cursor-pointer">
                        Export responses
                      </button>
                      <button className="border border-[#bbf7d0] text-[#16a34a] text-[11.5px] font-medium px-[12px] py-[6px] rounded-[8px] hover:bg-[#f0fdf4] transition-colors cursor-pointer">
                        Share results
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Near-limit amber warning block ── */}
                {nearLimit && !confirmedPause && (
                  <div className="bg-[#effdf4] border border-[#aef5c7] rounded-[12px] px-[17px] py-[15px] flex flex-col gap-[10px] w-full">

                    {/* Header row */}
                    <div className="flex items-center justify-between w-full">
                      <p className="text-[13px] font-semibold text-[#14532d] leading-normal">Almost reaching your target</p>
                      <button
                        onClick={() => setResponseLimit(String(limitNum + 500))}
                        className="bg-[#16a34a] text-white text-[11.5px] font-semibold px-[11px] py-[6px] rounded-[8px] hover:bg-[#15803d] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        ↑ Raise limit
                      </button>
                    </div>

                    {/* Progress section */}
                    <div className="flex flex-col gap-[6px]">
                      {/* Labels */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-semibold text-[#92400e]">{form.responses} responses</span>
                        <span className="text-[11px] font-medium text-[#5a5652]">{limitNum} limit</span>
                      </div>

                      {/* Amber progress bar */}
                      <div className="bg-[#fde68a] rounded-[20px] h-[7px] w-full overflow-hidden">
                        <div
                          className="bg-[#f59e0b] h-full rounded-[20px] transition-all"
                          style={{ width: `${limitPct}%` }}
                        />
                      </div>

                      {/* Timeline row */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10.5px] font-normal text-[#a09b94]">
                          {form.startedDate ? `${form.startedDate} (started)` : 'Today'}
                        </span>
                        <span className="text-[10.5px] font-medium text-[#92400e]">
                          {limitPct}% full · {remaining} responses left
                        </span>
                      </div>
                    </div>

                    {/* Prediction info box */}
                    <div className="bg-[rgba(255,255,255,0.7)] border border-[#86efac] rounded-[8px] px-[12px] py-[10px]">
                      <p className="text-[11.5px] font-normal text-[#78716c] leading-[17.25px]">
                        {daysToTarget ? (
                          <>
                            {'At your current rate, you\'ll hit the target in about '}
                            <span className="font-medium text-[#44403c]">{daysToTarget}–{daysToTarget + 1} days</span>
                            {'. Raise the limit to keep collecting.'}
                          </>
                        ) : (
                          <>You\'re getting close to your response limit. Raise the limit to keep collecting.</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Pause responses card (or Responses paused active state) ── */}
                {!limitReached && !nearLimit && confirmedPause ? (
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
                          onClick={() => { dispatch(clearFormPause(formId)); setSelectedPause('custom'); }}
                          className="flex items-center gap-[4px] px-[10px] py-[5px] text-[11.5px] font-medium text-[#1a1a1c] border border-[#e5e3dc] rounded-[7px] bg-white hover:bg-[#f4f3ef] transition-colors cursor-pointer"
                        >
                          <RiEditLine size={11} />
                          Edit
                        </button>
                        <button
                          onClick={() => dispatch(clearFormPause(formId))}
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
                ) : (!limitReached && !nearLimit) ? (

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
                            const h24 = ampm === 'PM' && parseInt(hour) !== 12
                              ? parseInt(hour) + 12
                              : ampm === 'AM' && parseInt(hour) === 12 ? 0 : parseInt(hour);
                            const endDate = new Date(viewYear, viewMonth, selDay, h24, parseInt(minute));
                            dispatch(setFormPause({
                              formId,
                              endLabel: label,
                              endTimestamp: endDate.getTime(),
                              pauseType: 'custom',
                              viewYear, viewMonth, selDay, hour, minute, ampm,
                            }));
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

                  {/* Warning banner + confirm (shown when custom picker is NOT open) */}
                  {selectedPause !== 'custom' && (
                    <>
                      <div className="bg-[#fff9ec] border border-[#f5e6b8] rounded-[9px] px-[14px] py-[10px] flex items-start gap-[8px]">
                        <RiErrorWarningLine size={14} className="text-[#9a6a00] shrink-0 mt-px" />
                        <p className="text-[11.5px] font-normal text-[#9a6a00] leading-[17.25px]">
                          {`Pausing won't delete existing responses. You can resume anytime from this panel.`}
                        </p>
                      </div>
                      {selectedPause && (
                        <button
                          onClick={handleConfirmPause}
                          className="self-end flex items-center gap-1.5 bg-[#1a1a1c] text-white text-[12px] font-medium px-4 py-[8px] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                        >
                          <RiPauseLine size={12} />
                          Confirm pause
                        </button>
                      )}
                    </>
                  )}
                </div>
                ) : null}{/* end confirmedPause/limitReached conditional */}

                {/* ── New responses alert ── */}
                <div className="bg-[#fdfcfb] border border-[#ede9e3] rounded-[12px] px-[17px] py-[14px] flex items-center justify-between">
                  <div className="flex flex-col gap-[2px]">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] leading-normal">New responses alert</p>
                    <p className="text-[11.5px] font-normal text-[#9a9590] leading-normal">
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

            </div>{/* end scrollable content area */}

            </>
            )}{/* end draft conditional */}
          </motion.div>
          )}{/* end form && */}
        </>
      )}
    </AnimatePresence>
  );
};

export default FormOverlayModal;

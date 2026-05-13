import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiAlertLine,
  RiArrowRightSLine,
  RiArrowUpSFill,
  RiBarChart2Line,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
} from 'react-icons/ri';

const LOAD_MS = 1400;
const MIN_RESPONSES_FOR_AI = 10;
/** Figma 19322 — reliable Top Patterns need more responses than general AI insights */
const MIN_RESPONSES_PATTERNS = 25;

/* -------------------------------------------------------------------------- */
/*  Mock content shown when the form has enough responses. Mirrors the Figma  */
/*  copy 1:1 so the design comparison is exact.                               */
/* -------------------------------------------------------------------------- */

const TOP_PATTERNS = [
  {
    percent: 84,
    label: 'Quick setup process highly appreciated',
    tag: 'UX',
    pillLabel: 'User Experience',
    percentColor: '#1a6133',
    barColor: '#1a6133',
    tagBg: '#ede8fc',
    tagBorder: 'rgba(72,54,166,0.18)',
    tagColor: '#4836a6',
    description:
      'Users consistently mention that they can get started in under 5 minutes without requiring extensive documentation or tutorials. This represents a significant competitive advantage.',
    examples: [
      'Set up my first form in 3 minutes - incredibly intuitive!',
      'No learning curve whatsoever, just works out of the box',
    ],
  },
  {
    percent: 67,
    label: 'Need better mobile optimization',
    tag: 'Feature Request',
    pillLabel: 'Feature Request',
    percentColor: '#b33030',
    barColor: '#b33030',
    tagBg: '#fef3e2',
    tagBorder: 'rgba(138,85,8,0.15)',
    tagColor: '#8a5508',
    description:
      'Mobile users report difficulty navigating forms on smaller screens. Form fields are often too small and layout breaks on certain devices.',
    examples: ['Would love to see better mobile support', 'Forms are hard to fill out on my phone'],
  },
  {
    percent: 59,
    label: 'Analytics dashboard very helpful',
    tag: 'Performance',
    pillLabel: 'Performance',
    percentColor: '#8a5508',
    barColor: '#8a5508',
    tagBg: '#ebf5ef',
    tagBorder: 'rgba(26,97,51,0.15)',
    tagColor: '#1a6133',
    description:
      'Users find the analytics clear and actionable, helping them make data-driven decisions about their forms and user engagement.',
    examples: [
      'Love the insights - helped us improve our conversion rate',
      'Dashboard gives us exactly what we need to know',
    ],
  },
];

const TREND_BARS = [
  { height: 30, color: '#efecea', opacity: 1 },
  { height: 48, color: '#c5d9cc', opacity: 1 },
  { height: 55, color: '#c5d9cc', opacity: 1 },
  { height: 38, color: '#efecea', opacity: 1 },
  { height: 72, color: '#1a6133', opacity: 0.6 },
  { height: 88, color: '#1a6133', opacity: 0.6 },
  { height: 100, color: '#1a6133', opacity: 0.6 },
];

const RECOMMENDED_ACTIONS = [
  {
    index: '01',
    title: 'Prioritize mobile responsive design improvements',
    tags: [
      { label: 'High Impact', bg: '#fbf0f0', border: 'rgba(179,48,48,0.15)', color: '#b33030' },
      { label: 'Urgent', bg: '#fef3e2', border: 'rgba(138,85,8,0.15)', color: '#8a5508' },
    ],
  },
  {
    index: '02',
    title: 'Implement multi-language support for forms',
    tags: [
      { label: 'High Impact', bg: '#fbf0f0', border: 'rgba(179,48,48,0.15)', color: '#b33030' },
    ],
  },
  {
    index: '03',
    title: 'Add a placeholder to Q2 and make it optional',
    tags: [
      { label: 'Quick win', bg: '#ebf5ef', border: 'rgba(26,97,51,0.15)', color: '#1a6133' },
    ],
  },
];

/** Figma 2241:19649 — copy + metrics for expanded Recommended Actions */
const RECOMMENDED_ACTIONS_EXPANDED = [
  {
    index: '01',
    title: 'Prioritize mobile responsive design improvements',
    body: [
      '67% of users flag mobile UX as a critical pain point. Improving responsive layouts across',
      'form views and the analytics dashboard will directly address the top-growing complaint',
      'category (+14% WoW).',
    ],
    tags: [
      { label: 'High Impact', bg: '#fdeaea', border: 'transparent', color: '#c94040' },
      { label: 'Urgent', bg: '#fdeaea', border: 'transparent', color: '#c94040' },
    ],
    estImpact: '+18% retention',
    usersAffected: '807 users',
    confidence: 'High (92%)',
    effortFilled: 3,
    effortLabel: 'Medium-High',
    ctaHint: 'Sprint ready',
  },
  {
    index: '02',
    title: 'Implement multi-language support for forms',
    body: [
      'Survey responses indicate 23% of users are operating in non-English locales. Adding',
      'Spanish, French, and German would unlock an estimated 280 additional monthly',
      'completions based on drop-off patterns.',
    ],
    tags: [{ label: 'High Impact', bg: '#fdeaea', border: 'transparent', color: '#c94040' }],
    estImpact: '+23% completion',
    usersAffected: '280+ users',
    confidence: 'Medium (76%)',
    effortFilled: 4,
    effortLabel: 'High',
    ctaHint: 'Needs scoping',
  },
  {
    index: '03',
    title: 'Add a placeholder to Q2 and make it optional',
    body: [
      'Q2 has an 18% abandonment spike. Adding helper text and removing the required',
      'constraint could recover 5–9 pts of completion rate with under 30 minutes of engineering',
      'effort.',
    ],
    tags: [{ label: 'Quick win', bg: '#e8f5ef', border: 'transparent', color: '#2d7a5a' }],
    estImpact: '+5–9pt completion',
    usersAffected: '~216 users',
    confidence: 'High (89%)',
    effortFilled: 1,
    effortLabel: 'Very Low',
    ctaHint: 'Ship today',
  },
];

function hashFormId(formId) {
  const s = String(formId ?? 'default');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h + s.charCodeAt(i) * (i + 1)) % 100000;
  }
  return h;
}

/** Figma 2241:19429 / 19478 / 19527 sentiment variations */
function quickStatsSentimentVariant(form) {
  const v = hashFormId(form?.id) % 4;
  if (v === 0) {
    return {
      key: 'balanced',
      positive: 68,
      neutral: 22,
      negative: 10,
      mode: 'segments',
      footnote: null,
    };
  }
  if (v === 1) {
    return {
      key: 'neutral100',
      positive: 0,
      neutral: 100,
      negative: 0,
      mode: 'single',
      singleColor: '#e8a830',
      accentLabel: 'neutral',
      footnote: 'Responses appear predominantly factual with limited sentiment signals.',
    };
  }
  if (v === 2) {
    return {
      key: 'negative100',
      positive: 0,
      neutral: 0,
      negative: 100,
      mode: 'single',
      singleColor: '#ec7063',
      accentLabel: 'negative',
      footnote: 'Responses appear predominantly factual with limited sentiment signals.',
    };
  }
  return {
    key: 'positive100',
    positive: 100,
    neutral: 0,
    negative: 0,
    mode: 'single',
    singleColor: '#abebab',
    accentLabel: 'positive',
    footnote: 'Responses appear predominantly factual with limited sentiment signals.',
  };
}

function MoreDetailsTrigger({ open, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? 'Show overview' : 'Show more details'}
      className="rounded-[7.715px] px-[13px] py-[4px] text-[14.788px] font-normal text-[#99968e] hover:bg-[#fafaf8] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.25)]"
    >
      {open ? 'Overview' : 'More Details'}
    </motion.button>
  );
}

function EffortDots({ filled, total = 5 }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="size-[6px] shrink-0 rounded-[3px]"
          style={{ backgroundColor: i < filled ? '#1a1a18' : '#e8e8e3' }}
          aria-hidden
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figma 2241:19367 — Failed to load patterns (inner)                        */
/* -------------------------------------------------------------------------- */

function PatternsFailedInner({ onRetry }) {
  return (
    <div className="flex w-full gap-3 rounded-[10px] border border-[#f5c0c0] bg-[#fff3f3] px-[16.714px] py-[14.714px]">
      <div className="flex shrink-0 flex-col items-start pt-px pb-[3.57px]">
        <span className="flex size-4 items-center justify-center text-[#c0392b]" aria-hidden>
          <RiAlertLine size={16} strokeWidth={1.75} />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[13px] font-bold leading-normal text-[#c0392b]">Failed to load patterns</p>
        <p className="text-[12px] font-normal leading-[18px] text-[#888]">
          Pattern analysis encountered an issue. Summary and Stats are
          <br />
          still available.
        </p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="mt-1 inline-flex w-fit items-center justify-center rounded-[6px] border border-[#d94040] bg-transparent px-[12.714px] pb-[6.42px] pt-[5.72px] text-[12px] font-normal text-[#d94040] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(217,64,64,0.35)]"
        >
          Retry this section
        </motion.button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figma 2241:18587 — Top Patterns card + load failure                         */
/* -------------------------------------------------------------------------- */

function TopPatternsErrorCard({ onRetry }) {
  return (
    <div className="flex min-h-0 flex-col bg-white px-[29.718px] pb-[40px] pt-[27.145px] border-[1.286px] border-[rgba(0,0,0,0.11)] rounded-[18px]">
      <div className="flex w-full items-center justify-between pb-[23.133px]">
        <p className="text-[16px] font-semibold leading-[25.075px] text-[#15140e]">Top Patterns</p>
        <span className="rounded-[7.715px] px-[13px] py-1 text-[14.788px] font-normal text-[#dadada] select-none">
          More Details
        </span>
      </div>
      <PatternsFailedInner onRetry={onRetry} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figma 2241:19322 — Top Patterns: not enough data                            */
/* -------------------------------------------------------------------------- */

function TopPatternsNotEnoughCard({ responseCount }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#ebebeb] bg-white p-px">
      <div className="flex flex-col items-start p-5">
        <p className="pb-[0.71px] text-[15px] font-bold leading-normal text-[#111]">Top Patterns</p>
        <div className="flex w-full flex-col items-center justify-center px-6 py-8">
          <div className="pb-4">
            <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#f2f2f2] text-[#71717a]">
              <RiBarChart2Line size={22} aria-hidden />
            </div>
          </div>
          <p className="pb-1.5 text-[13px] font-bold leading-normal text-[#333]">Not enough data</p>
          <p className="max-w-[280px] px-2.5 text-center text-[12px] font-normal leading-[19.2px] text-[#999]">
            Need 25+ responses to surface reliable patterns.
            <br />
            You have {responseCount} so far.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figma 2241:19339 — No data for this period (full card)                      */
/* -------------------------------------------------------------------------- */

function AiInsightsNoDataForPeriod({ rangeLabel, onClearFilter }) {
  return (
    <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-[12px] border border-[#ebebeb] bg-white p-px">
      <div className="flex flex-col items-center justify-center px-8 py-12">
        <div className="pb-4">
          <div className="flex size-14 items-center justify-center rounded-[16px] bg-[#f2f2f2] text-[#71717a]">
            <RiCalendarLine size={24} aria-hidden />
          </div>
        </div>
        <p className="pb-1.5 text-center text-[15px] font-bold leading-normal text-[#333]">
          No data for this period
        </p>
        <p className="max-w-[280px] px-3 text-center text-[13px] font-normal leading-[20.8px] text-[#999]">
          There were no responses
          {rangeLabel ? (
            <>
              {' '}
              for <span className="whitespace-nowrap">{rangeLabel}</span>.
            </>
          ) : (
            ' in the selected range.'
          )}
          <br />
          Try expanding the date range.
        </p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClearFilter}
          className="mt-5 inline-flex items-center justify-center rounded-[8px] border border-[#d0d0d0] bg-white px-[18.714px] pb-[10.42px] pt-[9.71px] text-[13px] font-bold text-[#111] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,0,0,0.12)]"
        >
          Clear filter
        </motion.button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figma 2241:19638 — Export / action error strip                              */
/* -------------------------------------------------------------------------- */

function InsightsErrorToast({ onRetry, onDismiss }) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex w-full items-center gap-3 overflow-hidden rounded-[12px] bg-[#fae0dc] px-4 py-3 shadow-[0px_4px_12px_0px_rgba(224,92,75,0.1)]"
    >
      <div className="flex size-5 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(220,38,38,0.25)] text-[#991b1b]">
        <RiAlertLine size={12} strokeWidth={2.25} aria-hidden />
      </div>
      <p className="min-w-0 flex-1 text-[13px] font-normal leading-[19.5px] text-[#5c1a13]">
        Export failed. Please try again
      </p>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="shrink-0 rounded-[8px] border border-[#e05c4b] px-[11px] py-1 text-[12px] font-medium text-[#5c1a13] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(224,92,75,0.4)]"
      >
        Retry
      </motion.button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 p-1 text-[#5c1a13]/80 hover:text-[#5c1a13] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(224,92,75,0.35)] rounded-md"
      >
        <RiCloseLine size={16} aria-hidden />
      </button>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figma 2241:19628 — Success strip                                            */
/* -------------------------------------------------------------------------- */

function InsightsSuccessToast({ onDismiss }) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-[12px] bg-[#d6f0e0] px-4 py-3 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]"
    >
      <div className="flex size-5 shrink-0 items-center justify-center rounded-[10px] bg-[#8fcfae] text-[#1a4731]">
        <RiCheckLine size={12} strokeWidth={2.5} aria-hidden />
      </div>
      <p className="min-w-0 flex-1 pr-8 text-[13px] font-normal leading-[19.5px] text-[#1a4731]">Insights updated</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#1a4731]/70 hover:text-[#1a4731] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,71,49,0.25)] rounded-md"
      >
        <RiCloseLine size={16} aria-hidden />
      </button>
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-[85%] rounded-bl-[12px] bg-[#4caf7d]"
        aria-hidden
      />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state — Figma 2241:19227                                            */
/* -------------------------------------------------------------------------- */

function AiInsightsEmpty({ onShareForm }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#ebebeb] bg-white p-px">
      <div className="flex flex-col items-center justify-center px-8 py-12">
        <div className="pb-4">
          <div className="flex size-[56px] items-center justify-center rounded-[16px] bg-[#f2f2f2]">
            <RiErrorWarningLine size={24} className="text-[#71717a]" aria-hidden />
          </div>
        </div>

        <div className="pb-1.5">
          <p className="text-center text-[15px] font-bold leading-normal text-[#333]">No insights yet</p>
        </div>

        <div className="max-w-[280px] text-center text-[13px] leading-[20.8px] text-[#999]">
          <p className="mb-0">
            <span className="font-normal">AI Insights need at least </span>
            <span className="font-bold">10 responses</span>
            <span className="font-normal"> to</span>
          </p>
          <p className="mb-0 font-normal">generate meaningful patterns. Share your form</p>
          <p className="font-normal">to get started.</p>
        </div>

        <motion.button
          type="button"
          onClick={onShareForm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-5 inline-flex items-center justify-center rounded-[8px] bg-[#111] px-[18px] pb-[9.71px] pt-[8.99px] text-[13px] font-bold text-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,0,0,0.2)]"
        >
          Share form
        </motion.button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading state — Figma 2241:19315 (Loading overlay)                       */
/* -------------------------------------------------------------------------- */

const SPINNER_R = 22.5;
const SPINNER_C = 2 * Math.PI * SPINNER_R;
/** ~28% arc — matches Figma “thin ring + dark segment” */
const SPINNER_ARC = (SPINNER_C * 0.28).toFixed(1);
const SPINNER_GAP = (SPINNER_C * 0.72).toFixed(1);

function AiInsightsLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[420px] w-full items-center justify-center bg-transparent px-4 py-12"
      aria-busy="true"
      aria-live="polite"
      aria-label="Analyzing your form"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative flex size-[64px] items-center justify-center" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 48 48" className="block overflow-visible">
            <circle
              cx="24"
              cy="24"
              r={SPINNER_R}
              fill="none"
              stroke="#F4F4F5"
              strokeWidth="3"
            />
            <motion.g
              style={{ transformOrigin: '24px 24px' }}
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            >
              <circle
                cx="24"
                cy="24"
                r={SPINNER_R}
                fill="none"
                stroke="#18181b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${SPINNER_ARC} ${SPINNER_GAP}`}
                transform="rotate(-90 24 24)"
              />
            </motion.g>
          </svg>
        </div>

        <p className="pt-1 text-[15px] font-semibold leading-normal text-[#18181b]">
          Analyzing your form…
        </p>
        <p className="text-[12px] font-normal leading-normal text-[#71717a]">
          AI is analysing data to provide insights
        </p>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  AI Summary + NPS banner — Figma 2241:18307                                */
/* -------------------------------------------------------------------------- */

function AiSummaryBanner() {
  return (
    <div
      className="rounded-[18px] border border-[rgba(0,0,0,0.11)] flex items-center justify-between gap-6 pl-[23px] pr-[23px] py-[19px]"
      style={{ background: 'linear-gradient(to right, #eff6ff, #faf5ff)' }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
        <p className="text-[14px] font-medium uppercase tracking-[0.42px] text-[#99968e] leading-[15.75px]">
          AI SUMMARY
        </p>
        <p className="text-[14px] leading-[22.95px] text-[#58564f]">
          Users love the{' '}
          <span className="font-semibold text-[#15140e]">fast setup and clean interface</span>.
          However, <span className="font-semibold text-[#15140e]">pricing clarity</span> is the top
          detractor — cited in 71% of negative responses. Fixing Q2&apos;s blank field could recover{' '}
          <span className="font-semibold text-[#15140e]">5–9 pts of completion rate</span>.
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-[2px]">
        <p className="text-[14px] font-medium text-[#99968e] leading-[15.75px] text-right">
          NPS Score
        </p>
        <p className="text-[56px] font-semibold leading-[56px] tracking-[-1.68px] text-[#15140e] text-right">
          78
        </p>
        <div className="flex items-center justify-end gap-[3px] pt-[1px]">
          <RiArrowUpSFill size={11} className="text-[#1a6133] shrink-0" />
          <span className="text-[12px] font-medium leading-[18px] text-[#1a6133] text-right whitespace-nowrap">
            +5.2% vs last quarter
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Priority Focus — Figma 2241:18322                                         */
/* -------------------------------------------------------------------------- */

function PriorityFocusCard() {
  return (
    <div className="rounded-[18px] border border-[rgba(152,16,250,0.2)] bg-[#f3f0f5] flex items-start justify-between gap-6 px-[18px] py-[22px]">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium uppercase tracking-[0.7px] text-[rgba(0,0,0,0.4)] leading-[15px]">
          PRIORITY FOCUS
        </p>
        <p className="mt-[7px] text-[20px] font-semibold leading-[26px] text-black">
          Invest in Pricing Clarity
        </p>
        <p className="mt-[6px] text-[14px] font-normal leading-[21.45px] text-[rgba(0,0,0,0.5)]">
          This addresses your top user pain point and could improve conversion by 25%, impacting
          312+ users immediately.
          <br aria-hidden />
          It reduces friction in the user journey, making actions faster and more intuitive.
          <br aria-hidden />
          This change also strengthens overall user trust and engagement with the platform.
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-[16px]">
        <div className="flex flex-col items-end gap-[2px]">
          <p className="text-[14px] font-normal leading-[15.75px] text-[rgba(0,0,0,0.35)] text-right">
            Estimated Impact
          </p>
          <p className="text-[14px] font-semibold leading-[21px] text-[rgba(0,0,0,0.9)] text-right">
            Very High
          </p>
        </div>
        <div className="flex flex-col items-end gap-[2px]">
          <p className="text-[14px] font-normal leading-[15.75px] text-[rgba(0,0,0,0.35)] text-right">
            Confidence
          </p>
          <p className="text-[14px] font-semibold leading-[21px] text-[rgba(0,0,0,0.9)] text-right">
            High (89%)
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="bg-white border border-[rgba(152,16,250,0.2)] rounded-[10px] px-[12px] py-[8px] text-[12.5px] font-semibold text-[#15140e] cursor-pointer"
        >
          Take action →
        </motion.button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top Patterns — Figma 2241:18344                                           */
/* -------------------------------------------------------------------------- */

function TopPatternsCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border-[1.286px] border-[rgba(0,0,0,0.11)] rounded-[18px] px-[30px] pt-[27px] pb-[27px] overflow-hidden">
      <div
        className={`flex items-center justify-between pb-[20px] pt-0 ${
          expanded ? 'border-b border-[#efefeb]' : ''
        }`}
      >
        <div className="min-w-0 pr-4">
          <p
            className={
              expanded
                ? 'text-[18px] font-semibold tracking-[-0.36px] text-[#1a1a18] leading-[21.6px]'
                : 'text-[16px] font-semibold leading-[25.075px] text-[#15140e]'
            }
          >
            Top Patterns
          </p>
          {expanded ? (
            <p className="mt-1 text-[13px] font-normal leading-normal text-[#9b9b95]">
              AI-prioritised based on impact & effort · {TOP_PATTERNS.length} patterns total
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MoreDetailsTrigger open={expanded} onClick={() => setExpanded((v) => !v)} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-[17px] pt-[14px]">
              {TOP_PATTERNS.map((p, idx) => (
                <div
                  key={p.label}
                  className={`pb-[17px] ${idx < TOP_PATTERNS.length - 1 ? 'border-b border-[rgba(0,0,0,0.07)]' : ''}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-[18px]">
                    <div className="w-[75px] shrink-0 sm:flex sm:justify-end">
                      <span
                        className="text-[33.433px] font-medium leading-[33.433px] sm:text-right"
                        style={{ color: p.percentColor }}
                      >
                        {p.percent}%
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
                        <p className="text-[16px] font-medium leading-[22.567px] text-[#15140e]">{p.label}</p>
                        <span
                          className="inline-flex shrink-0 items-center rounded-[25.717px] border-[0.8px] px-[11.716px] py-[4px] text-[12.859px] font-semibold leading-[19.288px]"
                          style={{
                            backgroundColor: p.tagBg,
                            borderColor: p.tagBorder,
                            color: p.tagColor,
                          }}
                        >
                          {p.pillLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] font-normal leading-[20.1px] text-[#6b6b65]">{p.description}</p>
                      <p className="mt-4 text-[13.502px] font-medium uppercase tracking-[0.27px] text-[#99968e]">
                        User Feedback Examples
                      </p>
                      <ul className="mt-2 flex flex-col gap-2">
                        {p.examples.map((ex) => (
                          <li
                            key={ex}
                            className="border-l-[2.4px] border-[#efecea] pl-[18.4px] text-[14px] italic leading-[21px] text-[#58564f]"
                          >
                            &ldquo;{ex}&rdquo;
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.ul
            key="compact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {TOP_PATTERNS.map((p, idx) => (
              <li
                key={p.label}
                className={`flex items-center gap-[18px] pt-[16px] pb-[18px] ${
                  idx < TOP_PATTERNS.length - 1 ? 'border-b-[1.429px] border-[rgba(0,0,0,0.07)]' : ''
                }`}
              >
                <div className="w-[75px] shrink-0 flex items-center justify-end">
                  <span
                    className="text-[33.433px] font-medium leading-[33.433px] text-right"
                    style={{ color: p.percentColor }}
                  >
                    {p.percent}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium leading-[22.567px] text-[#15140e]">{p.label}</p>
                  <div className="mt-[6px] h-[5.131px] w-full overflow-hidden bg-[#efecea] rounded-[2.572px]">
                    <div
                      className="h-full rounded-[2.572px]"
                      style={{
                        width: `${p.percent}%`,
                        backgroundColor: p.barColor,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                  <span
                    className="mt-[9px] inline-flex items-center rounded-[25.717px] border-[1.286px] px-[11.716px] py-[4px] text-[12.859px] font-semibold leading-[19.288px]"
                    style={{
                      backgroundColor: p.tagBg,
                      borderColor: p.tagBorder,
                      color: p.tagColor,
                    }}
                  >
                    {p.tag}
                  </span>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quick Stats — Figma 2241:18380                                            */
/* -------------------------------------------------------------------------- */

function QuickStatsCard({ form }) {
  const [expanded, setExpanded] = useState(false);
  const sentiment = useMemo(() => quickStatsSentimentVariant(form), [form]);

  const pctStyle = (bucket) => {
    if (sentiment.mode === 'single') {
      if (sentiment.accentLabel === bucket) {
        return { className: 'text-[17px] font-bold', color: sentiment.singleColor };
      }
      return { className: 'text-[17px] font-bold text-[#ccc]', color: undefined };
    }
    const colors = {
      positive: '#1a6133',
      neutral: '#15140e',
      negative: '#b33030',
    };
    return { className: 'text-[19.288px] font-semibold leading-[19.288px]', color: colors[bucket] };
  };

  return (
    <div className="bg-white border-[1.286px] border-[rgba(0,0,0,0.11)] rounded-[18px] px-[30px] py-[27px] flex flex-col gap-[20.574px] overflow-hidden">
      <div className="flex items-center justify-between">
        <p
          className={
            expanded
              ? 'text-[15px] font-normal text-[#111]'
              : 'text-[16px] font-semibold leading-[25.075px] text-[#15140e]'
          }
        >
          Quick Stats
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <MoreDetailsTrigger open={expanded} onClick={() => setExpanded((v) => !v)} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${expanded ? 'ex' : 'cmp'}-${sentiment.key}`}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.85 }}
          transition={{ duration: 0.2 }}
          className={expanded ? 'rounded-[0] -mx-[10px] flex flex-col gap-[10px] p-[20px]' : 'flex flex-col gap-[10.287px]'}
        >
          <p
            className={
              expanded
                ? 'text-[11px] font-normal leading-normal text-[#999]'
                : 'text-[13.502px] font-medium leading-[20.253px] tracking-[0.27px] text-[#99968e]'
            }
          >
            Sentiment Distribution
          </p>

          {sentiment.mode === 'segments' ? (
            <div className="flex gap-[2.572px] h-[10.274px] overflow-hidden rounded-[5.143px] w-full">
              <div className="h-full bg-[#abebab] rounded-l-[5.143px]" style={{ width: `${sentiment.positive}%` }} />
              <div className="h-full bg-[#fbdba7]" style={{ width: `${sentiment.neutral}%` }} />
              <div className="h-full bg-[#ec7063] rounded-r-[5.143px]" style={{ width: `${sentiment.negative}%` }} />
            </div>
          ) : (
            <div className="flex h-[10px] w-full overflow-hidden rounded-[5px]">
              <div className="h-full flex-1 rounded-[5px]" style={{ backgroundColor: sentiment.singleColor }} />
            </div>
          )}

          <div
            className={
              expanded
                ? 'flex flex-wrap gap-x-5 gap-y-2 items-start'
                : 'flex items-start justify-center pt-[2.572px]'
            }
          >
            {['positive', 'neutral', 'negative'].map((bucket) => {
              const labels = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };
              const values = {
                positive: sentiment.positive,
                neutral: sentiment.neutral,
                negative: sentiment.negative,
              };
              const st = pctStyle(bucket);
              return (
                <div
                  key={bucket}
                  className={
                    expanded
                      ? 'flex min-w-[72px] flex-col gap-[2px]'
                      : 'flex-1 min-w-0 flex flex-col items-start self-stretch'
                  }
                >
                  <p className={st.className} style={st.color ? { color: st.color } : undefined}>
                    {values[bucket]}%
                  </p>
                  <p
                    className={
                      expanded
                        ? 'text-[11px] font-normal text-[#999]'
                        : 'text-[14.145px] font-normal leading-[21.217px] text-[#99968e]'
                    }
                  >
                    {labels[bucket]}
                  </p>
                </div>
              );
            })}
          </div>

          {expanded && sentiment.footnote ? (
            <p className="text-[11px] font-normal leading-normal text-[#999]">{sentiment.footnote}</p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="h-[0.63px] w-full bg-[rgba(0,0,0,0.07)]" />

      <div className="flex flex-col gap-[10.261px]">
        <p className="text-[13.502px] font-medium leading-[20.253px] tracking-[0.27px] text-[#99968e]">
          Top Issue Category
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <p className="text-[20px] font-semibold leading-[34.719px] text-[#15140e]">Performance</p>
            <p className="text-[14.788px] font-normal leading-[22.181px] text-[#99968e]">
              of all feedback mentions
            </p>
          </div>
          <p className="text-[40px] font-medium leading-[41.148px] text-[#15140e] whitespace-nowrap">42%</p>
        </div>
      </div>

      <div className="h-[0.63px] w-full bg-[rgba(0,0,0,0.07)]" />

      <div className="flex flex-col gap-[10.261px]">
        <p className="text-[13.502px] font-medium leading-[20.253px] tracking-[0.27px] text-[#99968e]">7-Day Trend</p>
        <div className="flex gap-[5.143px] h-[46.279px] items-end justify-center w-full">
          {TREND_BARS.map((b, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[3.858px]"
              style={{
                height: `${b.height}%`,
                backgroundColor: b.color,
                opacity: b.opacity,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recommended Actions — Figma 2241:18431                                    */
/* -------------------------------------------------------------------------- */

function RecommendedActionsCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={
        expanded
          ? 'rounded-[16px] border border-[#e8e8e3] bg-white p-px shadow-[0px_24px_80px_rgba(0,0,0,0.18),0px_8px_24px_rgba(0,0,0,0.08)]'
          : 'rounded-[18px] border-[1.286px] border-[rgba(0,0,0,0.11)] bg-white px-[30px] py-[27px]'
      }
    >
      <div
        className={`flex items-start justify-between border-b border-[#efefeb] pb-[20.714px] pt-6 px-[28px] ${
          expanded ? '' : 'border-0 px-0 pb-[20px] pt-0'
        }`}
      >
        <div className="min-w-0 pr-4">
          <p
            className={
              expanded
                ? 'text-[18px] font-semibold tracking-[-0.36px] text-[#1a1a18] leading-[21.6px]'
                : 'text-[16.716px] font-semibold leading-[25.075px] text-[#15140e]'
            }
          >
            Recommended Actions
          </p>
          {expanded ? (
            <p className="mt-1 text-[13px] font-normal leading-normal text-[#9b9b95]">
              AI-prioritised based on impact & effort · 6 actions total
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <MoreDetailsTrigger open={expanded} onClick={() => setExpanded((v) => !v)} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="rec-ex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="border-b border-[#efefeb]">
              <div className="grid grid-cols-2 divide-x divide-y divide-[#efefeb] sm:grid-cols-4">
                {[
                  { n: '3', l: 'High Impact' },
                  { n: '2', l: 'Quick Wins' },
                  { n: '1', l: 'Long-term' },
                  { n: '312+', l: 'Users impacted', accent: '#2d7a5a' },
                ].map((c) => (
                  <div key={c.l} className="flex flex-col gap-1 py-4 pl-5 pr-5 sm:pr-[20.714px]">
                    <p
                      className="text-[26px] font-bold leading-[26px] tracking-[-1.04px]"
                      style={{ color: c.accent ?? '#1a1a18' }}
                    >
                      {c.n}
                    </p>
                    <p className="text-[11.5px] font-normal text-[#9b9b95]">{c.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {RECOMMENDED_ACTIONS_EXPANDED.map((a, idx) => (
              <div
                key={a.index}
                className={`@container grid grid-cols-1 gap-4 border-b border-[#efefeb] px-5 py-5 @md:grid-cols-[28px_1fr_minmax(120px,140px)] @md:gap-x-4 @md:px-7 ${
                  idx === RECOMMENDED_ACTIONS_EXPANDED.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <div className="hidden text-[11px] font-semibold tracking-[0.44px] text-[#9b9b95] @md:block">
                  {a.index}
                </div>
                <div className="flex min-w-0 flex-col gap-[5px]">
                  <span className="text-[11px] font-semibold tracking-[0.44px] text-[#9b9b95] @md:hidden">
                    {a.index}
                  </span>
                  <p className="text-[14px] font-semibold leading-[18.9px] text-[#1a1a18] break-words">
                    {a.title}
                  </p>
                  <div className="text-[13px] font-normal leading-[20.15px] text-[#6b6b65]">
                    {a.body.map((line, li) => (
                      <p key={li} className="mb-0">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {a.tags.map((t) => (
                      <span
                        key={t.label}
                        className="inline-flex items-center rounded-[20px] px-[9px] py-[3px] text-[11.5px] font-medium"
                        style={{ backgroundColor: t.bg, color: t.color }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                        Est. impact
                      </span>
                      <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.estImpact}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                        Users affected
                      </span>
                      <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.usersAffected}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                        Confidence
                      </span>
                      <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.confidence}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#9b9b95]">Effort</span>
                    <EffortDots filled={a.effortFilled} total={5} />
                    <span className="pl-0.5 text-[11px] text-[#9b9b95]">{a.effortLabel}</span>
                  </div>
                </div>
                <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 @md:flex-col @md:items-end @md:gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[12.5px] font-medium text-white cursor-pointer whitespace-nowrap"
                  >
                    Take action
                    <RiArrowRightSLine size={12} aria-hidden />
                  </motion.button>
                  <p className="text-[11px] font-normal text-[#9b9b95]">{a.ctaHint}</p>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="rec-compact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-[12.859px] overflow-hidden bg-[rgba(0,0,0,0.07)]"
          >
            <div className="grid grid-cols-1 gap-[1.286px] sm:grid-cols-2 lg:grid-cols-3">
              {RECOMMENDED_ACTIONS.map((a) => (
                <div
                  key={a.index}
                  className="@container flex min-h-[186px] flex-col gap-4 bg-white p-5 @sm:p-6"
                >
                  <p className="text-[12px] font-medium leading-[18px] text-[#555] @sm:text-[12.859px] @sm:leading-[19.288px]">
                    {a.index}
                  </p>
                  <p className="text-[14.5px] font-medium leading-[1.45] text-[#15140e] break-words @sm:text-[16px] @sm:leading-[1.5]">
                    {a.title}
                  </p>
                  <div className="mt-auto flex flex-col gap-3 @xs:flex-row @xs:flex-wrap @xs:items-center @xs:justify-between">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {a.tags.map((t) => (
                        <span
                          key={t.label}
                          className="inline-flex items-center rounded-[25.717px] border px-[10px] py-[3px] text-[11.5px] font-semibold leading-[18px] whitespace-nowrap @sm:text-[12.859px] @sm:leading-[19.288px] @sm:px-[11.716px]"
                          style={{
                            backgroundColor: t.bg,
                            borderColor: t.border,
                            color: t.color,
                          }}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      className="w-full shrink-0 rounded-[10px] border border-[rgba(152,16,250,0.2)] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#15140e] cursor-pointer whitespace-nowrap @xs:w-auto"
                    >
                      Take action →
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main panel — composes states                                              */
/* -------------------------------------------------------------------------- */

function AnalyticsAiInsightsPanel({
  form,
  rangeLabel,
  insightsNoDataInRange,
  onClearDateFilter,
  onShareForm,
}) {
  const [searchParams] = useSearchParams();
  const patternFailUrl = searchParams.get('aiPatternFail') === '1';
  const exportErrUrl = searchParams.get('aiExportError') === '1';
  const emptyPeriodUrl = searchParams.get('aiEmptyPeriod') === '1';

  const [loading, setLoading] = useState(true);
  const urlSyncKey = `${form?.id ?? ''}:${patternFailUrl ? 1 : 0}:${exportErrUrl ? 1 : 0}`;
  const [dismissals, setDismissals] = useState({
    urlKey: urlSyncKey,
    patternFailure: false,
    exportToast: false,
  });
  const [successVisible, setSuccessVisible] = useState(false);
  const successTimerRef = useRef(null);

  if (dismissals.urlKey !== urlSyncKey) {
    setDismissals({
      urlKey: urlSyncKey,
      patternFailure: false,
      exportToast: false,
    });
  }

  const responseCount = form?.responses ?? 0;
  const hasEnoughResponses = responseCount >= MIN_RESPONSES_FOR_AI;
  const showNoDataPeriod = Boolean(insightsNoDataInRange) || emptyPeriodUrl;
  const showExportToast = exportErrUrl && !dismissals.exportToast;
  const patternsLoadError = patternFailUrl && !dismissals.patternFailure;

  const rangeLabelForCopy =
    rangeLabel && rangeLabel !== 'All time' && rangeLabel !== 'Custom range…'
      ? rangeLabel
      : null;

  const flashSuccessBriefly = () => {
    setSuccessVisible(true);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessVisible(false), 3800);
  };

  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    []
  );

  useEffect(() => {
    let timeoutId;
    const rafId = requestAnimationFrame(() => {
      if (showNoDataPeriod || !hasEnoughResponses) {
        setLoading(false);
        return;
      }
      setLoading(true);
      timeoutId = setTimeout(() => setLoading(false), LOAD_MS);
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasEnoughResponses, form?.id, showNoDataPeriod]);

  if (showNoDataPeriod) {
    return (
      <div className="mx-auto w-full max-w-[480px]">
        <AiInsightsNoDataForPeriod
          rangeLabel={rangeLabelForCopy}
          onClearFilter={onClearDateFilter ?? (() => {})}
        />
      </div>
    );
  }

  if (!hasEnoughResponses) {
    return (
      <div className="mx-auto w-full max-w-[480px]">
        <AiInsightsEmpty onShareForm={onShareForm ?? (() => {})} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] min-h-[min(420px,52dvh)] items-center justify-center px-1 sm:px-2">
        <AiInsightsLoading />
      </div>
    );
  }

  const patternsColumn =
    patternsLoadError ? (
      <TopPatternsErrorCard
        onRetry={() => {
          setDismissals((d) => ({ ...d, patternFailure: true }));
          flashSuccessBriefly();
        }}
      />
    ) : responseCount < MIN_RESPONSES_PATTERNS ? (
      <TopPatternsNotEnoughCard responseCount={responseCount} />
    ) : (
      <TopPatternsCard />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-auto w-full max-w-[1200px] flex flex-col gap-[18px]"
    >
      <AnimatePresence mode="popLayout">
        {showExportToast ? (
          <InsightsErrorToast
            key="ai-export-error"
            onRetry={() => {
              setDismissals((d) => ({ ...d, exportToast: true }));
              flashSuccessBriefly();
            }}
            onDismiss={() => setDismissals((d) => ({ ...d, exportToast: true }))}
          />
        ) : null}
        {successVisible ? (
          <InsightsSuccessToast
            key="ai-success"
            onDismiss={() => {
              setSuccessVisible(false);
              if (successTimerRef.current) clearTimeout(successTimerRef.current);
            }}
          />
        ) : null}
      </AnimatePresence>

      <AiSummaryBanner />
      <PriorityFocusCard />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        {patternsColumn}
        <QuickStatsCard form={form} />
      </div>
      <RecommendedActionsCard />
    </motion.div>
  );
}

export default AnalyticsAiInsightsPanel;

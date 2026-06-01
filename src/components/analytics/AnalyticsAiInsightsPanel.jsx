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
import QuickStatsCard from './aiInsights/QuickStatsCard';
import RecommendedActionsCard from './aiInsights/RecommendedActionsCard';
import MoreDetailsTrigger from './aiInsights/MoreDetailsTrigger';

const LOAD_MS = 1800;
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
        <MoreDetailsTrigger open={false} onClick={() => {}} disabled />
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
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 overflow-visible"
          >
            <circle cx="24" cy="24" r={SPINNER_R} fill="none" stroke="#F4F4F5" strokeWidth="3" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="size-[48px]"
              style={{ transformOrigin: '50% 50%' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" className="block overflow-visible">
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
              </svg>
            </motion.div>
          </div>
        </div>

        <motion.p
          className="pt-1 text-[15px] font-semibold leading-normal text-[#18181b]"
          animate={{ opacity: [0.82, 1, 0.82] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          Analyzing your form…
        </motion.p>
        <motion.p
          className="text-[12px] font-normal leading-normal text-[#71717a]"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
        >
          AI is analysing data to provide insights
        </motion.p>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  AI Summary + NPS banner — Figma 2241:18307                                */
/* -------------------------------------------------------------------------- */

function AiSummaryBanner({ insight, npsScore }) {
  const summaryText = insight ?? null;
  const displayNps = npsScore ?? 78;

  return (
    <div
      className="rounded-[18px] border border-[rgba(0,0,0,0.11)] flex items-center justify-between gap-6 pl-[23px] pr-[23px] py-[19px]"
      style={{ background: 'linear-gradient(to right, #eff6ff, #faf5ff)' }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
        <p className="text-[14px] font-medium uppercase tracking-[0.42px] text-[#99968e] leading-[15.75px]">
          AI SUMMARY
        </p>
        {summaryText ? (
          <p className="text-[14px] leading-[22.95px] text-[#58564f]">{summaryText}</p>
        ) : (
          <p className="text-[14px] leading-[22.95px] text-[#58564f]">
            Users love the{' '}
            <span className="font-semibold text-[#15140e]">fast setup and clean interface</span>.
            However, <span className="font-semibold text-[#15140e]">pricing clarity</span> is the top
            detractor — cited in 71% of negative responses. Fixing Q2&apos;s blank field could recover{' '}
            <span className="font-semibold text-[#15140e]">5–9 pts of completion rate</span>.
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-[2px]">
        <p className="text-[14px] font-medium text-[#99968e] leading-[15.75px] text-right">
          NPS Score
        </p>
        <p className="text-[56px] font-semibold leading-[56px] tracking-[-1.68px] text-[#15140e] text-right">
          {displayNps}
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
/*  Top Patterns — Figma 2241:18740 (compact) / 18344 (expanded)              */
/* -------------------------------------------------------------------------- */

function TopPatternsCompactRow({ pattern: p, isLast }) {
  return (
    <div
      className={`flex items-center gap-[18px] ${
        isLast ? 'pt-4' : 'border-b border-[rgba(0,0,0,0.07)] py-4'
      }`}
    >
      <div className="w-[75px] shrink-0 flex justify-end">
        <span
          className="text-[33.433px] font-medium leading-[33.433px] text-right tabular-nums"
          style={{ color: p.percentColor }}
        >
          {p.percent}%
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-medium leading-[22.567px] text-[#15140e]">{p.label}</p>
        <div className="mt-[6px] h-[5.131px] w-full overflow-hidden rounded-[2.572px] bg-[#efecea]">
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
    </div>
  );
}

function TopPatternsCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border-[1.286px] border-[rgba(0,0,0,0.11)] rounded-[18px] px-[30px] pt-[27px] pb-[27px] overflow-hidden">
      <div
        className={`flex items-center justify-between pb-[20px] ${
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
        <MoreDetailsTrigger open={expanded} onClick={() => setExpanded((v) => !v)} />
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
                  className={`pb-[17px] ${
                    idx < TOP_PATTERNS.length - 1 ? 'border-b border-[rgba(0,0,0,0.07)]' : ''
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-[18px]">
                    <div className="w-[75px] shrink-0 sm:flex sm:justify-end">
                      <span
                        className="text-[33.433px] font-medium leading-[33.433px] sm:text-right tabular-nums"
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
                      <p className="mt-2 text-[13px] font-normal leading-[20.1px] text-[#6b6b65]">
                        {p.description}
                      </p>
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
          <motion.div
            key="compact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {TOP_PATTERNS.map((p, idx) => (
              <TopPatternsCompactRow
                key={p.label}
                pattern={p}
                isLast={idx === TOP_PATTERNS.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/*  Main panel — composes states                                              */
/* -------------------------------------------------------------------------- */

function AnalyticsAiInsightsPanel({
  form,
  rangeLabel,
  insightsNoDataInRange,
  onClearDateFilter,
  onShareForm,
  loadKey = 0,
  apiInsights,
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
    if (showNoDataPeriod || !hasEnoughResponses) {
      setLoading(false);
      return undefined;
    }
    // When API has finished processing, skip the simulated delay
    if (apiInsights?.status === 'ready') {
      setLoading(false);
      return undefined;
    }
    // When API is still computing, stay in loading until it resolves
    if (apiInsights?.status === 'processing') {
      setLoading(true);
      return undefined;
    }

    setLoading(true);
    const timeoutId = window.setTimeout(() => setLoading(false), LOAD_MS);
    return () => window.clearTimeout(timeoutId);
  }, [hasEnoughResponses, form?.id, showNoDataPeriod, rangeLabel, loadKey, apiInsights?.status]);

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
    <div className="mx-auto w-full max-w-[1200px] min-h-[min(420px,52dvh)]">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="ai-insights-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-[min(420px,52dvh)] w-full items-center justify-center px-1 sm:px-2"
          >
            <AiInsightsLoading />
          </motion.div>
        ) : (
          <motion.div
            key="ai-insights-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-[18px]"
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

      <AiSummaryBanner insight={apiInsights?.insight} npsScore={apiInsights?.npsScore} />
      <PriorityFocusCard />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        {patternsColumn}
        <QuickStatsCard form={form} />
      </div>
      <RecommendedActionsCard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnalyticsAiInsightsPanel;

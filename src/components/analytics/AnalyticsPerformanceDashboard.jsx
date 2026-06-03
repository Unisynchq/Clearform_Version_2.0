import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { AnimatePresence, motion } from 'motion/react';
import DropoffRiverChart from './DropoffRiverChart';
import {
  RIVER_FILTER_PILLS,
  RIVER_MIN_QUESTIONS,
  buildAdaptiveRiverColumns,
  getRiverQuestionCount,
  getRiverQuestionCountRaw,
  hasRiverEnoughData,
} from './dropoffRiverData';
import { deriveFormStats, deriveFormStatsFromApi } from './analyticsStats';
import { isApiConfigured } from '@/config/env';

const CHART_MAX = 20;
const CHART_MAX_COMPLETION = 100;
const CHART_MAX_TIME = 30;

const DAILY_BARS = [
  { label: 'Apr 1', value: 9, tier: 'ok' },
  { label: 'Apr 3', value: 7, tier: 'ok' },
  { label: 'Apr 5', value: 6, tier: 'warn' },
  { label: 'Apr 7', value: 11, tier: 'ok' },
  { label: 'Apr 9', value: 10, tier: 'ok' },
  { label: 'Apr 11', value: 8, tier: 'ok' },
  { label: 'Apr 12', value: 8, tier: 'warn' },
  { label: 'Apr 13', value: 12, tier: 'ok' },
  { label: 'Apr 14', value: 2, tier: 'bad', highlight: true },
  { label: 'Apr 15', value: 9, tier: 'ok' },
  { label: 'Apr 17', value: 10, tier: 'ok' },
  { label: 'Apr 19', value: 14, tier: 'ok' },
  { label: 'Apr 21', value: 11, tier: 'ok' },
  { label: 'Apr 23', value: 10, tier: 'ok' },
  { label: 'Apr 25', value: 9, tier: 'ok' },
];

/** Same x-axis as daily responses; values are 0–100% completion for that day. */
const COMPLETION_BARS = [
  { label: 'Apr 1', value: 84, tier: 'ok' },
  { label: 'Apr 3', value: 76, tier: 'warn' },
  { label: 'Apr 5', value: 87, tier: 'ok' },
  { label: 'Apr 7', value: 82, tier: 'ok' },
  { label: 'Apr 9', value: 81, tier: 'ok' },
  { label: 'Apr 11', value: 85, tier: 'ok' },
  { label: 'Apr 12', value: 83, tier: 'ok' },
  { label: 'Apr 13', value: 86, tier: 'ok' },
  { label: 'Apr 14', value: 52, tier: 'bad', highlight: true },
  { label: 'Apr 15', value: 81, tier: 'ok' },
  { label: 'Apr 17', value: 83, tier: 'ok' },
  { label: 'Apr 19', value: 88, tier: 'ok' },
  { label: 'Apr 21', value: 79, tier: 'warn' },
  { label: 'Apr 23', value: 80, tier: 'warn' },
  { label: 'Apr 25', value: 84, tier: 'ok' },
];

/** Seconds per question (demo series). */
const TIME_BARS = [
  { label: 'Apr 1', value: 6, tier: 'ok' },
  { label: 'Apr 3', value: 9, tier: 'ok' },
  { label: 'Apr 5', value: 5, tier: 'ok' },
  { label: 'Apr 7', value: 8, tier: 'ok' },
  { label: 'Apr 9', value: 10, tier: 'warn' },
  { label: 'Apr 11', value: 7, tier: 'ok' },
  { label: 'Apr 12', value: 8, tier: 'ok' },
  { label: 'Apr 13', value: 6, tier: 'ok' },
  { label: 'Apr 14', value: 24, tier: 'bad', highlight: true },
  { label: 'Apr 15', value: 8, tier: 'ok' },
  { label: 'Apr 17', value: 8, tier: 'ok' },
  { label: 'Apr 19', value: 7, tier: 'ok' },
  { label: 'Apr 21', value: 9, tier: 'warn' },
  { label: 'Apr 23', value: 11, tier: 'warn' },
  { label: 'Apr 25', value: 8, tier: 'ok' },
];

function barColor(tier) {
  if (tier === 'bad') return 'bg-[rgba(231,76,60,0.85)]';
  if (tier === 'warn') return 'bg-[rgba(245,166,35,0.65)]';
  return 'bg-[rgba(46,204,46,0.45)]';
}

function roundedPolyPath(points, radius) {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const vPrev = [prev[0] - curr[0], prev[1] - curr[1]];
    const vNext = [next[0] - curr[0], next[1] - curr[1]];
    const lenPrev = Math.hypot(vPrev[0], vPrev[1]) || 1;
    const lenNext = Math.hypot(vNext[0], vNext[1]) || 1;
    const r = Math.min(radius, lenPrev / 2, lenNext / 2);
    const p1 = [curr[0] + (vPrev[0] / lenPrev) * r, curr[1] + (vPrev[1] / lenPrev) * r];
    const p2 = [curr[0] + (vNext[0] / lenNext) * r, curr[1] + (vNext[1] / lenNext) * r];
    d += i === 0 ? `M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ` : `L ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} `;
    d += `Q ${curr[0].toFixed(2)} ${curr[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }
  return d + 'Z';
}

const FUNNEL_PATHS = {
  s1: roundedPolyPath(
    [
      [1.43, 0],
      [432.57, 0],
      [376.43, 66.83],
      [54.71, 66.83],
    ],
    10,
  ),
  s2: roundedPolyPath(
    [
      [54.71, 75.33],
      [376.43, 75.33],
      [328.66, 133.69],
      [102.48, 133.69],
    ],
    10,
  ),
  s3: roundedPolyPath(
    [
      [102.48, 142.19],
      [328.66, 142.19],
      [276.98, 205.32],
      [154.15, 205.32],
    ],
    10,
  ),
  s4: roundedPolyPath(
    [
      [154.15, 213.83],
      [276.98, 213.83],
      [215.57, 288.86],
    ],
    10,
  ),
};

/** Easings used across funnel layers. */
const FUNNEL_REVEAL_EASE = [0.22, 1, 0.36, 1];

/** Reusable motion preset for funnel layers (path or div). */
function funnelLayerProps(i, type = 'shape') {
  const baseDelay = 0.06 + i * 0.09;
  if (type === 'shape') {
    return {
      initial: { opacity: 0, scaleY: 0.4 },
      animate: { opacity: 1, scaleY: 1 },
      style: { transformOrigin: 'center top', transformBox: 'fill-box' },
      transition: { duration: 0.5, delay: baseDelay, ease: FUNNEL_REVEAL_EASE },
    };
  }
  if (type === 'label') {
    return {
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, delay: baseDelay + 0.18, ease: 'easeOut' },
    };
  }
  if (type === 'pill') {
    return {
      initial: { opacity: 0, scale: 0.85, x: -6 },
      animate: { opacity: 1, scale: 1, x: 0 },
      transition: { duration: 0.35, delay: baseDelay + 0.32, ease: FUNNEL_REVEAL_EASE },
    };
  }
  return {};
}

const statsEase = [0.22, 1, 0.36, 1];

/** Light column fade when the selected form changes (not a full-page skeleton). */
const statsColVariant = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: statsEase },
  },
};

const statsRowVariant = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.02 },
  },
};

function formatStatsDisplay(form, apiStats) {
  const s =
    isApiConfigured() || (apiStats && !apiStats.source)
      ? deriveFormStatsFromApi(form, apiStats)
      : deriveFormStats(form);
  if (apiStats && !apiStats.source && apiStats.avgTime && apiStats.avgTime !== '—') {
    s.avgTimeLabel = apiStats.avgTime;
  }
  const industry = 35;
  const diff = s.conversionPct - industry;
  const diffLabel = diff >= 0 ? `+${diff}` : `${diff}`;
  const convNum = parseFloat(s.conversion);
  const completionColorClass =
    Number.isFinite(convNum) && convNum < 18
      ? 'text-[#fb1a00]'
      : Number.isFinite(convNum) && convNum < 32
        ? 'text-[#c45c08]'
        : 'text-[#17160e]';
  const pillClass =
    diff < 0 ? 'bg-[#fef2df] text-[#a55c08]' : 'bg-[#eafaf1] text-[#1a6133]';
  return {
    ...s,
    industry,
    diffLabel,
    completionColorClass,
    pillClass,
    pillText: `${diffLabel}% vs industry`,
  };
}

/** @param {{ form?: object, apiStats?: object }} props */
export function AnalyticsStatsRow({ form, apiStats }) {
  const d = formatStatsDisplay(form, apiStats);

  return (
    <motion.section
      key={form?.id ?? 'stats'}
      className="bg-white rounded-[10px] px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 border border-[#e8e6e1]/80 min-h-[124px]"
      variants={statsRowVariant}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={statsColVariant} className="flex flex-col gap-[5px] md:pr-6">
        <p className="text-[12px] font-medium text-[#646464] tracking-[0.22px]">Total responses</p>
        <p className="text-[34px] font-medium text-black tracking-[-1.36px] leading-[34px] tabular-nums">
          {d.submitted.toLocaleString()}
        </p>
        <div className="flex flex-wrap items-center gap-1 text-[11.5px]">
          <span className={d.trendUp ? 'text-[#2d6b12]' : 'text-[#b33030]'}>
            {d.trendUp ? '↑' : '↓'} {d.trendPct}%
          </span>
          <span className="text-[#646464]">· {d.toTarget.toLocaleString()} to target</span>
        </div>
      </motion.div>

      <motion.div
        variants={statsColVariant}
        className="md:border-l-2 md:border-[#e9e7e0] md:pl-6 flex flex-col gap-[5px]"
      >
        <div className="flex flex-wrap items-center gap-2 min-h-[14px]">
          <span className="text-[12px] font-medium text-[#646464] tracking-[0.22px]">Completion rate</span>
          <span
            className={`${d.pillClass} text-[10px] font-semibold tracking-[0.22px] px-[7px] py-[2px] rounded-full`}
          >
            {d.pillText}
          </span>
        </div>
        <p
          className={`text-[34px] font-medium tracking-[-1.36px] leading-[34px] tabular-nums ${d.completionColorClass}`}
        >
          {d.conversion}%
        </p>
        <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-[#646464]">
          <span>Industry avg.</span>
          <span className="font-bold text-[#17160e]">{d.industry}%</span>
        </div>
      </motion.div>

      <motion.div
        variants={statsColVariant}
        className="md:border-l-2 md:border-[#e9e7e0] md:pl-6 flex flex-col gap-[5px]"
      >
        <p className="text-[12px] font-medium text-[#646464] tracking-[0.22px]">Avg. time</p>
        <p className="text-[34px] font-medium text-[#17160e] tracking-[-1.36px] leading-[34px] tabular-nums">
          {d.avgTimeLabel}
        </p>
        <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-[#646464]">
          <span>~ on target</span>
          <span>
            · {d.trendUp ? `${d.trendPct}% faster` : `${d.trendPct}% slower`} than median
          </span>
        </div>
      </motion.div>
    </motion.section>
  );
}

export function AnalyticsFunnelCard({ form, apiStats }) {
  const stats =
    isApiConfigured() || (apiStats && !apiStats.source)
      ? deriveFormStatsFromApi(form, apiStats)
      : deriveFormStats(form);
  const animKey = `${form?.id ?? 'empty'}-${apiStats?.responses ?? 'demo'}`;

  return (
    <div className="bg-white rounded-[10px] px-4 sm:px-8 py-6 flex flex-col items-center border border-[#eceae4]/80 min-h-[420px]">
      <section
        className="flex w-full max-w-[520px] flex-col items-center gap-[14px]"
        aria-label="Response funnel from reach to submission"
      >
        <div className="w-full overflow-x-auto">
          <div className="relative mx-auto h-[332px] w-[434px] shrink-0" key={animKey}>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="absolute left-0 top-0 flex h-[34px] w-[434px] items-center justify-center rounded-[10px] border border-[#d8d6d0] bg-[#f7f6f2] px-2 py-1"
            >
              <span className="text-[12px] font-semibold leading-[19.5px] text-black whitespace-nowrap">
                Target Responses - {stats.target.toLocaleString()}
              </span>
            </motion.div>

            <svg
              className="pointer-events-none absolute left-0 top-[42.74px] block overflow-visible"
              width="434"
              height="289"
              viewBox="0 0 434 289"
              aria-hidden
            >
              <defs>
                <linearGradient id="afFill1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ece9e2" />
                  <stop offset="100%" stopColor="#dcd8cf" />
                </linearGradient>
                <linearGradient id="afFill2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e6e2d9" />
                  <stop offset="100%" stopColor="#d3cec3" />
                </linearGradient>
                <linearGradient id="afFill3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4dada" />
                  <stop offset="100%" stopColor="#ecc6c6" />
                </linearGradient>
                <linearGradient id="afFill4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8eedb" />
                  <stop offset="100%" stopColor="#9adfbe" />
                </linearGradient>
              </defs>
              <motion.path
                {...funnelLayerProps(0)}
                d={FUNNEL_PATHS.s1}
                fill="url(#afFill1)"
                stroke="#cfcbc4"
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
              <motion.path
                {...funnelLayerProps(1)}
                d={FUNNEL_PATHS.s2}
                fill="url(#afFill2)"
                stroke="#c9c5bc"
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
              <motion.path
                {...funnelLayerProps(2)}
                d={FUNNEL_PATHS.s3}
                fill="url(#afFill3)"
                stroke="#e0a8a8"
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
              <motion.path
                {...funnelLayerProps(3)}
                d={FUNNEL_PATHS.s4}
                fill="url(#afFill4)"
                stroke="#7cecbc"
                strokeWidth="0.7"
                strokeLinejoin="round"
              />
            </svg>

            <motion.span
              {...funnelLayerProps(0, 'label')}
              className="absolute left-[131.19px] top-[65.52px] w-[168.76px] text-center text-[12px] font-medium leading-[19.5px] text-black tabular-nums"
            >
              {stats.reached.toLocaleString()} Users reached
            </motion.span>

            <motion.span
              {...funnelLayerProps(1, 'label')}
              className="absolute left-[162.08px] top-[136.62px] w-[106.98px] text-center text-[12px] font-medium leading-[19.5px] tabular-nums"
            >
              <span className="text-black">{stats.opened.toLocaleString()}</span>
              <span className="text-[#6f6f6f]"> </span>
              <span className="text-black">Opened</span>
            </motion.span>

            <motion.span
              {...funnelLayerProps(2, 'label')}
              className="absolute left-[174.13px] top-[204.78px] w-[82.87px] text-center text-[12px] font-medium leading-[19.5px] text-[#c05050] tabular-nums"
            >
              <span>{stats.started.toLocaleString()}</span>
              <span className="text-[#676767]"> </span>
              <span>Started</span>
            </motion.span>

            <motion.span
              {...funnelLayerProps(3, 'label')}
              className="absolute left-[198.99px] top-[275.12px] w-[33.15px] text-center text-[12px] font-medium leading-[19.5px] text-[#2d8a65] tabular-nums"
            >
              {stats.submitted.toLocaleString()}
            </motion.span>

            <motion.span
              {...funnelLayerProps(2, 'pill')}
              aria-hidden
              className="pointer-events-none absolute left-[298.86px] top-[218px] block h-px w-[54.58px] bg-[#1a1a1c] origin-left"
            />
            <motion.div
              {...funnelLayerProps(2, 'pill')}
              className="absolute left-[353.44px] top-[203.21px] flex h-[29.76px] w-[100.56px] items-center justify-center rounded-[10px] border border-[#ff8181] bg-[#f5e8e8] px-2 py-1"
            >
              <span className="whitespace-nowrap text-[12px] font-medium leading-[19.5px] text-[#c05050] tabular-nums">
                {stats.drops[1].pct}% Drop off
              </span>
            </motion.div>

            <motion.span
              {...funnelLayerProps(3, 'pill')}
              aria-hidden
              className="pointer-events-none absolute left-[250.8px] top-[288.5px] block h-px w-[54.58px] bg-[#1a1a1c] origin-left"
            />
            <motion.div
              {...funnelLayerProps(3, 'pill')}
              className="absolute left-[305.38px] top-[273.56px] flex h-[29.76px] w-[128.5px] items-center justify-center rounded-[10px] border border-[#7cecbc] bg-[#d4f0e4] px-2 py-1"
            >
              <span className="whitespace-nowrap text-[12px] font-medium leading-[19.5px] text-[#2d8a65] tabular-nums">
                {stats.startedSubmittedSuccess}% Submissions
              </span>
            </motion.div>
          </div>
        </div>

        <div className="grid w-full max-w-[434px] shrink-0 grid-cols-3 gap-x-4 pt-px">
          {[
            {
              k: 'conv',
              label: 'Conversion',
              valueColor: '#3aad85',
              subColor: '#2d8a65',
              value: `${stats.conversion}%`,
              sub: 'reach → submit',
            },
            {
              k: 'drop',
              label: 'Biggest drop',
              valueColor: '#d95f5f',
              subColor: '#a03030',
              value: `${stats.biggest.pct}%`,
              sub: stats.biggest.stepLabel,
            },
            {
              k: 'tgt',
              label: 'To target',
              valueColor: '#e8a838',
              subColor: '#9a6a10',
              value: stats.toTarget.toLocaleString(),
              sub: 'responses left',
            },
          ].map((tile, i) => (
            <motion.div
              key={`${animKey}-${tile.k}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                delay: 0.45 + i * 0.06,
                ease: 'easeOut',
              }}
              className="flex min-w-0 flex-col items-start gap-[3px] justify-self-stretch rounded-[10px] bg-[#F7F6F2] py-[11px] pl-3 pr-3"
            >
              <p className="w-full text-[10px] font-medium uppercase leading-normal tracking-[0.7px] text-[#5e5e5e]">
                {tile.label}
              </p>
              <p
                className="w-full text-[16px] font-medium leading-normal not-italic tabular-nums"
                style={{
                  fontFamily: "'DM Mono', ui-monospace, monospace",
                  color: tile.valueColor,
                }}
              >
                {tile.value}
              </p>
              <p
                className="w-full text-[10px] font-medium leading-normal"
                style={{ color: tile.subColor }}
              >
                {tile.sub}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildBarsFromSeries(series, seg) {
  if (!Array.isArray(series) || series.length === 0) return null;
  const toLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const toTier = (val, max) => {
    const ratio = max > 0 ? val / max : 0;
    if (ratio < 0.2) return 'bad';
    if (ratio < 0.5) return 'warn';
    return 'ok';
  };
  if (seg === 'responses') {
    const vals = series.map((r) => r.count);
    const max = Math.max(...vals, 1);
    return series.map((r) => ({ label: toLabel(r.date), value: r.count, tier: toTier(r.count, max) }));
  }
  if (seg === 'completion') {
    return series.map((r) => {
      const val = r.count > 0 ? Math.round((r.completions / r.count) * 100) : 0;
      return { label: toLabel(r.date), value: val, tier: val < 40 ? 'bad' : val < 65 ? 'warn' : 'ok' };
    });
  }
  if (seg === 'time') {
    const vals = series.map((r) => (r.avgDuration ? Math.round(r.avgDuration / 1000) : 0));
    const max = Math.max(...vals, 1);
    return series.map((r, i) => ({ label: toLabel(r.date), value: vals[i], tier: toTier(vals[i], max) }));
  }
  return null;
}

export function AnalyticsDailyResponsesCard({ apiStats }) {
  const [seg, setSeg] = useState('responses');
  const tabs = [
    { id: 'responses', label: 'Responses / day' },
    { id: 'completion', label: 'Completion rate' },
    { id: 'time', label: 'Time per question' },
  ];

  const apiBars = useMemo(() => buildBarsFromSeries(apiStats?.dailySeries, seg), [apiStats?.dailySeries, seg]);

  const useApiBars = Boolean(apiBars?.length);

  const avgFromSeries = useMemo(() => {
    if (!apiBars?.length) return null;
    const sum = apiBars.reduce((acc, b) => acc + b.value, 0);
    return (sum / apiBars.length).toFixed(1);
  }, [apiBars]);

  const panel = useMemo(() => {
    switch (seg) {
      case 'completion':
        return {
          chartMax: CHART_MAX_COMPLETION,
          bars: apiBars ?? COMPLETION_BARS,
          yTicks: ['100', '75', '50', '25', '0'],
          kpiWhole: useApiBars ? avgFromSeries : '13.5',
          kpiFraction: '%',
          kpiSub: 'Avg. completion rate',
          trend: useApiBars
            ? null
            : {
            icon: 'down',
            wrapCls: 'bg-[#fff8ee]',
            textCls: 'text-[#a16207]',
            text: 'Below trend · last 30 days',
          },
          insight: useApiBars
            ? null
            : {
            border: 'border-[#ffe8c8]',
            bg: 'bg-[#fffbf5]',
            textCls: 'text-[#a16207]',
            body: 'Apr 14 fell to 52% completion — worth checking if the form felt longer that day.',
          },
          chartTitle: 'Completion rate',
          guideTop: 'top-[32%]',
          guideLabel: 'industry avg.: 35%',
        };
      case 'time':
        return {
          chartMax: CHART_MAX_TIME,
          bars: apiBars ?? TIME_BARS,
          yTicks: ['30', '24', '18', '12', '6'],
          kpiWhole: useApiBars ? avgFromSeries : '8.4',
          kpiFraction: 's',
          kpiSub: 'Avg. time per question',
          trend: useApiBars
            ? null
            : {
            icon: 'up',
            wrapCls: 'bg-[#eafaf1]',
            textCls: 'text-[rgba(26,158,78,0.85)]',
            text: 'Getting faster · last 30 days',
          },
          insight: useApiBars
            ? null
            : {
            border: 'border-[#ffd6d6]',
            bg: 'bg-[#fff5f5]',
            textCls: 'text-[rgba(192,57,43,0.65)]',
            body: 'Apr 14 averaged 24s per question — possible friction or distraction.',
          },
          chartTitle: 'Seconds per question',
          guideTop: 'top-[28%]',
          guideLabel: 'goal: 10s',
        };
      default:
        return {
          chartMax: CHART_MAX,
          bars: apiBars ?? DAILY_BARS,
          yTicks: ['20', '15', '10', '5', '0'],
          kpiWhole: useApiBars ? avgFromSeries : '8.3',
          kpiFraction: '/day',
          kpiSub: 'Avg. responses per day',
          trend: useApiBars
            ? null
            : {
            icon: 'up',
            wrapCls: 'bg-[#eafaf1]',
            textCls: 'text-[rgba(26,158,78,0.85)]',
            text: 'Trending up · last 30 days',
          },
          insight: useApiBars
            ? null
            : {
            border: 'border-[#ffd6d6]',
            bg: 'bg-[#fff5f5]',
            textCls: 'text-[rgba(192,57,43,0.65)]',
            body: 'Apr 14 had the lowest responses — only 2 on that day',
          },
          chartTitle: 'Responses per day',
          guideTop: 'top-[25%]',
          guideLabel: 'typical: 8',
        };
    }
  }, [seg, apiBars, useApiBars, avgFromSeries]);

  return (
    <div className="bg-white rounded-[20px] border border-[#ebebeb] overflow-hidden flex flex-col min-h-[420px]">
      <div className="flex flex-wrap gap-1 px-3 pt-3 border-b border-[#ebebeb]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSeg(t.id)}
            className={`rounded-t-[8px] px-[14px] py-[7px] text-[12.5px] transition-colors cursor-pointer ${
              seg === t.id
                ? 'bg-[#111] text-white font-semibold'
                : 'text-[#7c7c7c] font-medium hover:bg-[#f4f3ef]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4 pb-2 flex flex-col gap-4 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={seg}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-4 flex-1 min-h-0"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-1 text-[#111]">
                <span className="text-[46px] font-black tracking-[-3px] leading-none tabular-nums">
                  {panel.kpiWhole}
                </span>
                <span className="text-[19px] font-semibold tracking-[-0.5px] tabular-nums">
                  {panel.kpiFraction}
                </span>
              </div>
              <p className="text-[12px] text-[#7c7c7c]">{panel.kpiSub}</p>
              {panel.trend ? (
                <div
                  className={`inline-flex items-center gap-2 rounded-[20px] px-[10px] py-[5px] w-fit ${panel.trend.wrapCls}`}
                >
                  {panel.trend.icon === 'up' ? (
                    <RiArrowUpLine className={panel.trend.textCls} size={14} />
                  ) : (
                    <RiArrowDownLine className={panel.trend.textCls} size={14} />
                  )}
                  <span className={`text-[12px] font-semibold ${panel.trend.textCls}`}>
                    {panel.trend.text}
                  </span>
                </div>
              ) : null}
            </div>

            {panel.insight ? (
              <div
                className={`rounded-[10px] px-[15px] py-[9px] flex items-start gap-2 border ${panel.insight.border} ${panel.insight.bg}`}
              >
                <RiErrorWarningLine className={`${panel.insight.textCls} shrink-0 mt-0.5`} size={14} />
                <p className={`text-[13px] font-bold leading-snug ${panel.insight.textCls}`}>
                  {panel.insight.body}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10.5px] font-bold text-[#6d6d6d] tracking-[0.63px] uppercase">
                  {panel.chartTitle}
                </span>
                <div className="flex flex-wrap gap-3 text-[10.5px] text-[#7c7c7c] font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-[7px] rounded-[3.5px] bg-[rgba(46,204,46,0.4)]" /> On track
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-[7px] rounded-[3.5px] bg-[rgba(245,166,35,0.4)]" /> A bit low
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-[7px] rounded-[3.5px] bg-[rgba(231,76,60,0.8)]" /> Much lower
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 items-end flex-1 pt-2 pb-6 border-b border-[#eceae4] relative">
                <div className="flex shrink-0 flex-col justify-between text-[9px] sm:text-[10px] font-medium text-[#6a6a6a] pr-1 min-w-[28px] h-[168px] py-1 tabular-nums leading-tight text-right">
                  {panel.yTicks.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className="flex-1 flex items-end justify-between gap-1 sm:gap-[3px] h-[168px] relative min-w-0">
                  {panel.bars.map((d, bi) => {
                    const hPct = (d.value / panel.chartMax) * 100;
                    return (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <div className="relative w-full flex justify-center items-end h-[148px]">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${hPct}%` }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 30,
                              delay: 0.05 + bi * 0.022,
                            }}
                            className={`w-[72%] max-w-[28px] rounded-t-[4px] self-end ${barColor(d.tier)} ${
                              d.highlight ? 'ring-2 ring-[rgba(231,76,60,0.5)]' : ''
                            }`}
                            style={{ minHeight: d.value > 0 ? 3 : 0 }}
                          />
                          {d.highlight && (
                            <span className="absolute -top-5 text-[9px] sm:text-[10px] font-bold text-[rgba(231,76,60,0.85)] tabular-nums">
                              {d.value}
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] sm:text-[10px] text-[#6d6d6d] text-center leading-tight max-w-full px-0.5">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                  <div
                    className={`pointer-events-none absolute left-[8%] right-[8%] border-t border-dashed border-[#d8d6d0] ${panel.guideTop}`}
                  />
                  <span className="pointer-events-none absolute right-2 top-[18%] text-[8px] sm:text-[9px] text-[#6d6d6d] font-medium max-w-[min(120px,40%)] text-right">
                    {panel.guideLabel}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const BAND_BADGE = {
  critical: { label: 'Critical', cls: 'bg-[#fce7e7] text-[#b91c1c]' },
  attention: { label: 'Watch', cls: 'bg-[#fef3c7] text-[#a16207]' },
  healthy: { label: 'Healthy', cls: 'bg-[#eafaf1] text-[#2d8a65]' },
};

const TOOLTIP_W = 232;
/** Horizontal gap between active column edge and tooltip (px). */
const TOOLTIP_BAR_GAP = 12;

export function AnalyticsDropoffRiverCard({ form, reduceMountMotion = false }) {
  const [filter, setFilter] = useState('all');
  const [hoverQ, setHoverQ] = useState(null);
  const [pinnedQ, setPinnedQ] = useState(null);

  const sectionRef = useRef(null);

  const enoughRiverData = useMemo(() => hasRiverEnoughData(form), [form]);

  const columns = useMemo(() => {
    if (!enoughRiverData) return [];
    return buildAdaptiveRiverColumns(form);
  }, [enoughRiverData, form]);

  const rawQuestionCount = useMemo(() => getRiverQuestionCountRaw(form), [form]);
  const questionCount = useMemo(() => getRiverQuestionCount(form), [form]);
  const displayQuestionCount = rawQuestionCount ?? questionCount;

  useEffect(() => {
    if (pinnedQ == null) return;
    const onPointerDown = (e) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target)) {
        setPinnedQ(null);
        setHoverQ(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [pinnedQ]);

  const riverTrackRef = useRef(null);
  const riverAnchorRef = useRef(null);
  const [riverMetrics, setRiverMetrics] = useState({ centers: [], rights: [], totalWidth: 0 });

  const onRiverCentersMeasured = useCallback(({ centers, rights, totalWidth }) => {
    setRiverMetrics({ centers, rights: rights ?? [], totalWidth });
  }, []);

  const safePinnedQ = pinnedQ != null && pinnedQ < columns.length ? pinnedQ : null;

  const active = safePinnedQ != null ? columns[safePinnedQ] : null;
  const badge = active ? BAND_BADGE[active.kind] : BAND_BADGE.healthy;

  const sectionMotion = reduceMountMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: 'easeOut' },
      };
  const headerMotion = reduceMountMotion
    ? {}
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, delay: 0.05 },
      };

  return (
    <motion.section
      ref={sectionRef}
      key={`rc-${form?.id ?? 'empty'}`}
      {...sectionMotion}
      className={`bg-[#fafaf8] border border-[#e8e8e5] rounded-[10px] p-[17px] flex flex-col gap-4 shadow-[0_2px_2px_rgba(0,0,0,0.08)] ${
        enoughRiverData ? 'min-h-[380px]' : ''
      }`}
    >
      <motion.div
        {...headerMotion}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-[10px] font-semibold text-[#888780] tracking-[0.7px] uppercase">
            Question drop-off river
          </h3>
          <span className="text-[11px] font-medium tabular-nums text-[#a8a6a0]">
            {displayQuestionCount} question{displayQuestionCount === 1 ? '' : 's'}
          </span>
        </div>
      </motion.div>
      {!enoughRiverData ? (
        <div className="rounded-[10px] border border-[#eceae4] bg-[#f7f6f2] px-4 py-6 text-center">
          <p className="text-[13px] font-medium text-[#3f3f46]">Not enough data</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b6966]">
            Add at least {RIVER_MIN_QUESTIONS} questions to your form to see the drop-off river.
          </p>
        </div>
      ) : (
        <>
      <div className="flex flex-wrap gap-[5px] items-center">
        {RIVER_FILTER_PILLS.map((p, i) => {
          const isActive = filter === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setFilter(p.id)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08 + i * 0.04 }}
              className={`rounded-[20px] px-[13px] py-[5px] text-[11px] border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#1a1a18] border-[#1a1a18] text-white'
                  : 'bg-white border-[#d3d1c7] text-[#5f5e5a] hover:bg-[#f4f3ef]'
              }`}
            >
              {p.label}
            </motion.button>
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="flex flex-wrap gap-4 text-[11px] text-[#5f5e5a]"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#dc2626]" /> Critical (70–100%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#ca8a04]" /> Attention (40–70%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#16a34a]" /> Healthy (0–15%)
        </span>
      </motion.div>
      <div className="relative flex min-h-[min(360px,48vh)] w-full justify-start bg-transparent p-0 pb-px">
        <div ref={riverAnchorRef} className="relative m-0 w-full min-w-0 bg-transparent p-0">
          <div
            ref={riverTrackRef}
            className="m-0 w-full overflow-x-auto overflow-y-visible bg-transparent overscroll-x-contain p-0 pb-px"
          >
            <DropoffRiverChart
              anchorRef={riverAnchorRef}
              form={form}
              columns={columns}
              filter={filter}
              hoverIndex={hoverQ}
              selectedIndex={safePinnedQ}
              onHoverIndex={setHoverQ}
              onSelectIndex={setPinnedQ}
              onColumnCentersMeasured={onRiverCentersMeasured}
            />
          </div>
          <AnimatePresence>
            {active ? (
              <motion.div
                key={`tip-${safePinnedQ}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="pointer-events-none absolute top-1/2 z-[100] max-w-[calc(100%-16px)] -translate-y-1/2 rounded-[10px] bg-white p-3 shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
                style={{
                  left: (() => {
                    const idx = safePinnedQ;
                    const tw = riverMetrics.totalWidth;
                    const { centers, rights } = riverMetrics;
                    if (idx == null || tw <= 0) return 8;
                    const barRight = rights[idx];
                    const cx = centers[idx];
                    const edge =
                      barRight != null && Number.isFinite(barRight) && barRight > 0
                        ? barRight
                        : cx != null && Number.isFinite(cx)
                          ? cx + 40
                          : 0;
                    if (!Number.isFinite(edge) || edge <= 0) return 8;
                    let l = edge + TOOLTIP_BAR_GAP;
                    const maxL = Math.max(tw - TOOLTIP_W - 8, 8);
                    l = Math.min(l, maxL);
                    return Math.max(8, l);
                  })(),
                  width: TOOLTIP_W,
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] font-semibold tracking-[0.5px] uppercase text-[#888780]">
                    <span className="text-[#3aad85] mr-1">{active.q}</span>
                    Text
                  </p>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="text-[15px] font-semibold text-[#18181b]">Your name</div>
                <div className="mt-2 flex items-baseline gap-3 text-[13px]">
                  <span>
                    <strong className="text-[#18181b]">1,712</strong>{' '}
                    <span className="text-[#888780] text-[11px]">Reached</span>
                  </span>
                  <span className="text-[#dc2626] font-medium">
                    {active.drop ?? '−4%'}{' '}
                    <span className="text-[#888780] font-normal text-[11px]">Dropped</span>
                  </span>
                  <span>
                    <strong className="text-[#18181b]">8s</strong>{' '}
                    <span className="text-[#888780] text-[11px]">Avg time</span>
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[#7c7c7c] bg-[#f7f6f2] rounded-[8px] px-3 py-1.5 border border-[#eceae4]">
                  {active.kind === 'critical'
                    ? 'Significant drop-off — review this step.'
                    : active.kind === 'attention'
                      ? 'Engagement is dipping here.'
                      : 'Fastest completion in the flow.'}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
        </>
      )}
    </motion.section>
  );
}

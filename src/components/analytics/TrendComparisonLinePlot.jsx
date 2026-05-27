import { useCallback, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const AXIS_STROKE = '#e5e7eb';
const GRID_STROKE = 'rgba(15, 23, 42, 0.06)';
const TICK_LABEL_FILL = '#6b7280';
const LINE_PRIMARY = '#000000';
const LINE_SECONDARY_RGB = '148, 163, 184';
const LINE_FILL_RGB = '148, 163, 175';

const LINE_BASE = {
  borderWidth: 2.5,
  borderCapStyle: 'round',
  borderJoinStyle: 'round',
  tension: 0.38,
  pointRadius: 0,
  pointHoverRadius: 0,
  spanGaps: true,
};

const NICE_MULTIPLES = [1, 2, 3, 4, 5, 6, 8, 10];

/**
 * Pick the smallest "nice" step from `multiple × 10ⁿ` that fits the target.
 * Produces integer ticks at every magnitude (no 1.5/2.5/7.5) so percentage
 * axes never show fractional labels.
 */
function niceStep(target) {
  if (!Number.isFinite(target) || target <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  for (const m of NICE_MULTIPLES) {
    const candidate = m * magnitude;
    if (candidate >= target) return candidate;
  }
  return 10 * magnitude;
}

/** Minimum vertical breathing room between the active data points and the tooltip card (px). */
const TOOLTIP_POINT_CLEARANCE = 18;
/** Tooltip card sits this far below the top edge of the chart area when there's room. */
const TOOLTIP_TOP_INSET = 6;
/** Horizontal half-width budget used to keep the card from spilling outside the chart on the edges. */
const TOOLTIP_HALF_WIDTH = 96;
const TOOLTIP_SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 0.6 };
const tooltipFontStyle = {
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontWeight: 500,
};

/**
 * Builds a 0-based 4-interval Y scale that always covers the data with a small
 * headroom and produces "nice" round tick labels at any magnitude.
 */
function computeYRange(chartData) {
  let max = 0;
  for (const d of chartData) {
    if (typeof d.seriesA === 'number') max = Math.max(max, d.seriesA);
    if (typeof d.seriesB === 'number') max = Math.max(max, d.seriesB);
  }
  if (!Number.isFinite(max) || max <= 0) {
    return { min: 0, max: 24, ticks: [24, 18, 12, 6, 0] };
  }
  const padded = max * 1.12;
  const step = niceStep(padded / 4);
  const niceMax = step * 4;
  return {
    min: 0,
    max: niceMax,
    ticks: [niceMax, step * 3, step * 2, step, 0],
  };
}

function formatNumber(v, suffix) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '';
  const rounded = Math.round(v * 10) / 10;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${str}${suffix}`;
}

function buildPrimaryDataset(seriesA) {
  return {
    ...LINE_BASE,
    label: 'A',
    data: seriesA,
    borderColor: LINE_PRIMARY,
    fill: false,
    order: 1,
  };
}

function buildSecondaryDataset(seriesB, seriesBActive) {
  const lineOpacity = seriesBActive ? 1 : 0.3;
  const fillTopAlpha = seriesBActive ? 0.22 : 0.03;
  const fillBottomAlpha = seriesBActive ? 0.04 : 0;

  return {
    ...LINE_BASE,
    label: 'B',
    data: seriesB,
    borderColor: `rgba(${LINE_SECONDARY_RGB}, ${lineOpacity})`,
    backgroundColor(context) {
      const { chart } = context;
      const { ctx, chartArea } = chart;
      if (!chartArea) return 'transparent';
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, `rgba(${LINE_FILL_RGB}, ${fillTopAlpha})`);
      gradient.addColorStop(1, `rgba(${LINE_FILL_RGB}, ${fillBottomAlpha})`);
      return gradient;
    },
    fill: true,
    order: 2,
  };
}

/**
 * Endpoint dot markers — black filled dot on the primary line, hollow white
 * dot with a gray ring on the secondary line.
 */
const trendEndpointsPlugin = {
  id: 'trendComparisonEndpoints',

  afterDatasetsDraw(chart) {
    const cfg = chart.options.plugins?.trendComparisonEndpoints;
    if (!cfg) return;

    const { seriesBActive, lastIndex } = cfg;
    const { ctx } = chart;
    const metaA = chart.getDatasetMeta(1);
    const metaB = chart.getDatasetMeta(0);
    if (!metaA?.data?.[lastIndex]) return;

    const ptA = metaA.data[lastIndex];
    const { x: ax, y: ay } = ptA.getProps(['x', 'y'], true);

    ctx.save();
    ctx.fillStyle = LINE_PRIMARY;
    ctx.beginPath();
    ctx.arc(ax, ay, 5, 0, Math.PI * 2);
    ctx.fill();

    if (seriesBActive && metaB?.data?.[lastIndex]) {
      const ptB = metaB.data[lastIndex];
      const { x: bx, y: by } = ptB.getProps(['x', 'y'], true);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  },
};

ChartJS.register(trendEndpointsPlugin);

/**
 * Thin vertical guide drawn behind the lines at the hovered x position.
 * Gives the cursor a clear anchor independent of the floating pills.
 */
const hoverGuidePlugin = {
  id: 'trendHoverGuide',

  beforeDatasetsDraw(chart) {
    const cfg = chart.options.plugins?.trendHoverGuide;
    if (!cfg || cfg.activeIndex == null) return;

    const metaA = chart.getDatasetMeta(1);
    const pt = metaA?.data?.[cfg.activeIndex];
    if (!pt) return;

    const { ctx, chartArea } = chart;
    const { x } = pt.getProps(['x'], true);

    ctx.save();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

ChartJS.register(hoverGuidePlugin);

/**
 * Two-series trend chart. Lines + endpoint dots are drawn by Chart.js; the
 * hover tooltip pills sit as a thin React overlay so they can be styled and
 * animated independently.
 */
export default function TrendComparisonLinePlot({
  chartData,
  yTickSuffix = '',
  tooltipSuffix = '',
  betterDirection = 'higher',
  seriesATitle = 'Current',
  seriesBTitle = 'Compare',
  seriesBActive = true,
}) {
  const lastIndex = chartData.length - 1;
  const [hover, setHover] = useState(null);

  const yRange = useMemo(() => computeYRange(chartData), [chartData]);

  const data = useMemo(
    () => ({
      labels: chartData.map((d) => d.name),
      datasets: [
        buildSecondaryDataset(chartData.map((d) => d.seriesB), seriesBActive),
        buildPrimaryDataset(chartData.map((d) => d.seriesA)),
      ],
    }),
    [chartData, seriesBActive],
  );

  const handleExternalTooltip = useCallback(
    (context) => {
      const { tooltip, chart } = context;
      if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
        setHover(null);
        return;
      }
      const idx = tooltip.dataPoints[0]?.dataIndex;
      if (idx == null) {
        setHover(null);
        return;
      }
      const metaA = chart.getDatasetMeta(1);
      const metaB = chart.getDatasetMeta(0);
      const ptA = metaA?.data?.[idx];
      if (!ptA) {
        setHover(null);
        return;
      }
      const ptB = metaB?.data?.[idx];
      const valA = chart.data.datasets[1]?.data?.[idx];
      const valB = chart.data.datasets[0]?.data?.[idx];
      const labelA = formatNumber(valA, tooltipSuffix);
      const labelB = formatNumber(valB, tooltipSuffix);
      if (!labelA && !labelB) {
        setHover(null);
        return;
      }

      /* Anchor the consolidated card to the x position of the hovered points
         and a y position that always sits above the highest visible dot,
         clamped inside the chart area so it never clips on the edges. */
      const area = chart.chartArea;
      const cx = ptA.x;
      const highestY = Math.min(
        ptA.y,
        seriesBActive && ptB ? ptB.y : Number.POSITIVE_INFINITY,
      );
      const targetY = Math.max(
        (area?.top ?? 0) + TOOLTIP_TOP_INSET,
        highestY - TOOLTIP_POINT_CLEARANCE,
      );
      const cardY = Math.min(targetY, highestY - TOOLTIP_POINT_CLEARANCE);
      const minX = (area?.left ?? 0) + TOOLTIP_HALF_WIDTH;
      const maxX = (area?.right ?? cx) - TOOLTIP_HALF_WIDTH;
      const cardX = Math.min(Math.max(cx, minX), maxX);

      setHover({
        index: idx,
        cardX,
        cardY,
        xLabel: chart.data.labels?.[idx] ?? '',
        labelA,
        labelB,
      });
    },
    [tooltipSuffix, seriesBActive],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1100,
        easing: 'easeOutQuart',
      },
      animations: {
        x: { duration: 700, easing: 'easeOutCubic' },
        y: { duration: 1100, easing: 'easeOutQuart' },
      },
      layout: { padding: { top: 56, right: 24, bottom: 4, left: 0 } },
      interaction: { intersect: false, mode: 'index', axis: 'x' },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          mode: 'index',
          intersect: false,
          external: handleExternalTooltip,
        },
        trendComparisonEndpoints: { seriesBActive, lastIndex },
        trendHoverGuide: { activeIndex: hover?.index ?? null },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: TICK_LABEL_FILL,
            font: { size: 11, family: 'ui-sans-serif, system-ui, sans-serif' },
            padding: 8,
          },
          border: { display: true, color: AXIS_STROKE },
          offset: false,
        },
        y: {
          min: yRange.min,
          max: yRange.max,
          afterBuildTicks: (scale) => {
            scale.ticks = yRange.ticks.map((value) => ({ value }));
          },
          ticks: {
            callback: (v) => `${v}${yTickSuffix}`,
            color: TICK_LABEL_FILL,
            font: { size: 11, family: 'ui-sans-serif, system-ui, sans-serif' },
            padding: 8,
            autoSkip: false,
          },
          grid: {
            color: GRID_STROKE,
            borderDash: [4, 4],
            tickLength: 0,
            drawTicks: false,
          },
          border: { display: true, color: AXIS_STROKE },
        },
      },
    }),
    [yRange, seriesBActive, lastIndex, yTickSuffix, tooltipSuffix, handleExternalTooltip, hover?.index],
  );

  const tooltipVisible = !!hover && (!!hover.labelA || !!hover.labelB);
  const showBRow = seriesBActive && !!hover?.labelB;

  return (
    <div className="relative h-[clamp(260px,42vh,340px)] w-full min-w-[480px] [&_canvas]:max-h-full [&_canvas]:max-w-full">
      <div
        className="pointer-events-none absolute right-3 top-2 z-10 flex items-center sm:right-4"
        aria-hidden
      >
        <span className="shrink-0 rounded-full bg-[#fafaf9]/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748b] shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-[#e2e8f0]/80">
          {betterDirection === 'higher' ? '↑ Higher is better' : '↓ Lower is better'}
        </span>
      </div>

      <Line data={data} options={options} />

      <motion.div
        className="pointer-events-none absolute left-0 top-0 z-20"
        style={{ pointerEvents: 'none' }}
        initial={false}
        animate={{
          x: hover?.cardX ?? 0,
          y: hover?.cardY ?? 0,
          opacity: tooltipVisible ? 1 : 0,
        }}
        transition={{ ...TOOLTIP_SPRING, opacity: { duration: 0.15, ease: 'easeOut' } }}
      >
        <div
          className="-translate-x-1/2 -translate-y-full rounded-[10px] bg-[#1a1a1a] px-3 py-2 text-white shadow-[0_8px_22px_rgba(0,0,0,0.28)] ring-1 ring-white/5"
          style={tooltipFontStyle}
        >
          {hover?.xLabel ? (
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/55">
              {hover.xLabel}
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[12px] leading-none">
              <span className="size-2 shrink-0 rounded-full bg-white" aria-hidden />
              <span className="max-w-[140px] truncate text-white/70">{seriesATitle}</span>
              <span className="ml-auto pl-3 font-semibold text-white tabular-nums">
                {hover?.labelA ?? ''}
              </span>
            </div>
            {showBRow ? (
              <div className="flex items-center gap-2 text-[12px] leading-none">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: '#94a3af' }}
                  aria-hidden
                />
                <span className="max-w-[140px] truncate text-white/70">{seriesBTitle}</span>
                <span className="ml-auto pl-3 font-semibold text-white tabular-nums">
                  {hover.labelB}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

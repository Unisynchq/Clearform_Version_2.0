import { BAR_TARGET_FILL_RATIO } from './analyticsMetrics';

/** Completed submissions for one day — never opened/started/reached sessions. */
export function dailySubmissionsCount(row) {
  if (row == null) return 0;
  if (typeof row.submissions === 'number') return row.submissions;
  if (typeof row.submitted === 'number') return row.submitted;
  if (typeof row.completions === 'number') return row.completions;
  if (typeof row.count === 'number') return row.count;
  return 0;
}

/** Sessions started that day — denominator for completion rate, not submission counts. */
export function dailySessionsCount(row) {
  if (row == null) return 0;
  if (typeof row.sessions === 'number') return row.sessions;
  if (typeof row.started === 'number') return row.started;
  return dailySubmissionsCount(row);
}

export function formatDailyDateLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Axis maximum so the tallest bar fills ~75% of plot height (≈15–20% headroom above).
 * Never scales small counts against session totals.
 */
export function chartMaxForBarScale(maxValue, { targetFill = BAR_TARGET_FILL_RATIO, min = 1 } = {}) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return min;
  const raw = maxValue / targetFill;
  if (raw <= 10) return Math.max(min, Math.ceil(raw));
  return niceRoundChartMax(raw, { min });
}

/** @deprecated Prefer chartMaxForBarScale — kept for tests migrating gradually. */
export function chartMaxWithHeadroom(maxValue, { headroomPct = 0.15, min = 1 } = {}) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return min;
  return niceRoundChartMax(maxValue * (1 + headroomPct), { min });
}

export function niceRoundChartMax(max, { min = 1 } = {}) {
  const safe = Math.max(max, min);
  if (safe <= 5) return Math.max(Math.ceil(safe), min);
  const magnitude = 10 ** Math.floor(Math.log10(safe));
  const normalized = safe / magnitude;
  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  const rounded = nice * magnitude;
  return Math.max(rounded >= safe ? rounded : Math.ceil(safe / magnitude) * magnitude, min);
}

/** Five tick labels from 0 to chartMax (descending for CSS layout). */
export function buildYTicks(chartMax, tickCount = 5) {
  const max = Math.max(chartMax, 1);
  const steps = tickCount - 1;
  const rawStep = max / steps;
  let step;
  if (max <= 5) step = 1;
  else if (max <= 10) step = 2;
  else step = niceRoundChartMax(rawStep, { min: 1 }) / (max <= 20 ? 1 : 1);
  if (step <= 0 || !Number.isFinite(step)) step = max / steps;
  const ticks = [];
  for (let i = steps; i >= 0; i -= 1) {
    const v = Math.round((max * i) / steps);
    ticks.push(String(v));
  }
  return [...new Set(ticks)];
}

function toTier(val, max) {
  if (val == null || !Number.isFinite(val)) return 'warn';
  const ratio = max > 0 ? val / max : 0;
  if (ratio < 0.2) return 'bad';
  if (ratio < 0.5) return 'warn';
  return 'ok';
}

/**
 * When rows lack explicit submission fields but `count` sums far above funnel total,
 * `count` is likely opened/started — treat as zero for the responses chart.
 */
export function sanitizeDailySeriesForSubmissions(series, totalSubmitted) {
  if (!Array.isArray(series) || series.length === 0) return series;
  const hasExplicit = series.some(
    (r) => typeof r.submissions === 'number' || typeof r.submitted === 'number',
  );
  if (hasExplicit || totalSubmitted == null) return series;

  const fromCount = series.map((r) => (typeof r.count === 'number' ? r.count : 0));
  const fromCompletions = series.map((r) => (typeof r.completions === 'number' ? r.completions : 0));
  const sumCount = fromCount.reduce((a, b) => a + b, 0);
  const sumCompletions = fromCompletions.reduce((a, b) => a + b, 0);

  if (sumCompletions > 0 && sumCompletions <= (totalSubmitted || Infinity) * 1.5) {
    return series.map((r) => ({
      ...r,
      submissions: typeof r.completions === 'number' ? r.completions : 0,
    }));
  }

  if (sumCount > 0 && totalSubmitted >= 0 && sumCount > totalSubmitted * 2) {
    return series.map((r) => ({ ...r, submissions: 0 }));
  }

  return series;
}

/** Per-question dwell time from interaction timestamps only (no session-duration fallback). */
export function dailyTimePerQuestionSec(row) {
  if (typeof row?.avgTimePerQuestionSec === 'number' && row.avgTimePerQuestionSec > 0) {
    return row.avgTimePerQuestionSec;
  }
  return null;
}

/** Daily reach → submit rate using explicit funnel denominators when present. */
export function dailyCompletionRatePct(row, funnelContext = {}) {
  if (row == null) return null;

  let num = null;
  if (typeof row.completions === 'number') num = row.completions;
  else if (typeof row.submissions === 'number') num = row.submissions;
  else if (typeof row.submitted === 'number') num = row.submitted;

  if (num == null) return null;

  let denom =
    typeof row.reached === 'number'
      ? row.reached
      : typeof row.started === 'number'
        ? row.started
        : typeof row.sessions === 'number'
          ? row.sessions
          : typeof row.opened === 'number'
            ? row.opened
            : null;

  // Backend often sends session volume as `count` alongside daily completions.
  if (denom == null && typeof row.count === 'number' && row.count > 0 && row.count >= num) {
    denom = row.count;
  }

  if (denom == null) {
    denom =
      funnelContext.reached ??
      funnelContext.started ??
      funnelContext.opened ??
      null;
  }

  if (denom == null || denom <= 0) return null;
  return Math.round((num / denom) * 100);
}

/**
 * Build bar chart panel for Performance tab.
 * @returns {{ bars, chartMax, yTicks, isEmpty } | null}
 */
export function buildDailyChartPanel(series, seg, { totalSubmitted, funnel } = {}) {
  const funnelContext = funnel ?? {};
  const hasSubmissions = (totalSubmitted ?? 0) > 0;

  if (seg === 'completion') {
    const aggregateRate =
      funnelContext.reached > 0 && hasSubmissions
        ? Math.round(((totalSubmitted ?? 0) / funnelContext.reached) * 100)
        : null;

    if (!Array.isArray(series) || series.length === 0) {
      if (!hasSubmissions || aggregateRate == null) {
        return { chartMax: 100, yTicks: buildYTicks(100), isEmpty: true, bars: [] };
      }
      const chartMax = Math.min(100, chartMaxForBarScale(aggregateRate, { min: Math.max(1, aggregateRate) }));
      return {
        chartMax,
        yTicks: buildYTicks(chartMax),
        isEmpty: false,
        bars: [
          {
            label: 'All time',
            value: aggregateRate,
            tier: aggregateRate < 40 ? 'bad' : aggregateRate < 65 ? 'warn' : 'ok',
            date: null,
          },
        ],
      };
    }

    const vals = series.map((r) => dailyCompletionRatePct(r, funnelContext));
    let bars = series.map((r, i) => {
      const val = vals[i];
      if (val == null) {
        return { label: formatDailyDateLabel(r.date), value: null, tier: 'warn', date: r.date };
      }
      return {
        label: formatDailyDateLabel(r.date),
        value: val,
        tier: 'warn',
        date: r.date,
      };
    });

    let numericVals = vals.filter((v) => v != null && Number.isFinite(v));

    // Fall back to aggregate funnel rate on days with completions but no per-day denominator.
    if (hasSubmissions && numericVals.length === 0 && aggregateRate != null) {
      bars = series.map((r) => {
        const dayCompletions =
          typeof r.completions === 'number'
            ? r.completions
            : typeof r.submissions === 'number'
              ? r.submissions
              : typeof r.submitted === 'number'
                ? r.submitted
                : 0;
        const value = dayCompletions > 0 ? aggregateRate : 0;
        return {
          label: formatDailyDateLabel(r.date),
          value,
          tier: value < 40 ? 'bad' : value < 65 ? 'warn' : 'ok',
          date: r.date,
        };
      });
      numericVals = bars.map((b) => b.value).filter((v) => Number.isFinite(v));
    }

    const seriesMax = Math.max(...numericVals, 0);
    const tierMax = Math.max(...numericVals, 1);
    bars = bars.map((bar) =>
      bar.value != null && Number.isFinite(bar.value)
        ? { ...bar, tier: toTier(bar.value, tierMax) }
        : bar,
    );

    const chartMax =
      seriesMax > 0
        ? Math.min(100, chartMaxForBarScale(seriesMax, { min: Math.max(1, seriesMax) }))
        : 100;

    return {
      chartMax,
      yTicks: buildYTicks(chartMax),
      isEmpty: !hasSubmissions,
      bars,
    };
  }

  if (!Array.isArray(series) || series.length === 0) return null;

  if (seg === 'responses') {
    const sanitized = sanitizeDailySeriesForSubmissions(series, totalSubmitted);
    const vals = sanitized.map((r) => dailySubmissionsCount(r));
    const seriesMax = Math.max(...vals, 0);
    const isEmpty = vals.every((v) => v === 0);
    const chartMax = isEmpty ? 5 : chartMaxForBarScale(seriesMax, { min: seriesMax > 0 ? seriesMax : 5 });
    const tierMax = Math.max(...vals, 1);
    return {
      chartMax,
      yTicks: buildYTicks(chartMax),
      isEmpty,
      bars: sanitized.map((r) => {
        const value = dailySubmissionsCount(r);
        return {
          label: formatDailyDateLabel(r.date),
          value,
          tier: toTier(value, tierMax),
          date: r.date,
        };
      }),
    };
  }

  if (seg === 'time') {
    const vals = series.map((r) => dailyTimePerQuestionSec(r));
    const numericVals = vals.filter((v) => v != null && Number.isFinite(v));
    if (numericVals.length === 0) return null;
    const seriesMax = Math.max(...numericVals, 1);
    const chartMax = chartMaxForBarScale(seriesMax);
    const tierMax = Math.max(...numericVals, 1);
    return {
      chartMax,
      yTicks: buildYTicks(chartMax),
      isEmpty: false,
      bars: series.map((r, i) => {
        const val = vals[i];
        if (val == null) {
          return { label: formatDailyDateLabel(r.date), value: null, tier: 'warn', date: r.date };
        }
        return {
          label: formatDailyDateLabel(r.date),
          value: val,
          tier: toTier(val, tierMax),
          date: r.date,
        };
      }),
    };
  }

  return null;
}

export function dailyMetricValue(row, trendMetric) {
  if (trendMetric === 'responses') return dailySubmissionsCount(row);
  if (trendMetric === 'completion') return dailyCompletionRatePct(row) ?? 0;
  return dailyTimePerQuestionSec(row);
}

export function averageDailySubmissions(series, totalSubmitted) {
  const sanitized = sanitizeDailySeriesForSubmissions(series ?? [], totalSubmitted);
  const vals = sanitized.map((r) => dailySubmissionsCount(r)).filter((v) => Number.isFinite(v));
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  if (sum > 0) return (sum / vals.length).toFixed(1);
  if (totalSubmitted != null && totalSubmitted > 0) {
    return (totalSubmitted / vals.length).toFixed(1);
  }
  return '0.0';
}

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

/** Round up to a readable axis maximum with ~15% headroom above the tallest bar. */
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

export function dailyTimePerQuestionSec(row) {
  if (typeof row?.avgTimePerQuestionSec === 'number' && row.avgTimePerQuestionSec > 0) {
    return row.avgTimePerQuestionSec;
  }
  if (row?.avgDuration && row.avgDuration > 0) return Math.round(row.avgDuration / 1000);
  return null;
}

/**
 * Build bar chart panel for Performance tab.
 * @returns {{ bars, chartMax, yTicks, isEmpty } | null}
 */
export function buildDailyChartPanel(series, seg, { totalSubmitted } = {}) {
  if (!Array.isArray(series) || series.length === 0) return null;

  if (seg === 'responses') {
    const sanitized = sanitizeDailySeriesForSubmissions(series, totalSubmitted);
    const vals = sanitized.map((r) => dailySubmissionsCount(r));
    const seriesMax = Math.max(...vals, 0);
    const isEmpty = vals.every((v) => v === 0);
    const chartMax = isEmpty ? 5 : chartMaxWithHeadroom(seriesMax, { min: seriesMax > 0 ? seriesMax : 5 });
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

  if (seg === 'completion') {
    const vals = series.map((r) => {
      const denom = dailySessionsCount(r);
      const num = typeof r.completions === 'number' ? r.completions : dailySubmissionsCount(r);
      return denom > 0 ? Math.round((num / denom) * 100) : 0;
    });
    return {
      chartMax: 100,
      yTicks: ['100', '75', '50', '25', '0'],
      isEmpty: false,
      bars: series.map((r, i) => ({
        label: formatDailyDateLabel(r.date),
        value: vals[i],
        tier: vals[i] < 40 ? 'bad' : vals[i] < 65 ? 'warn' : 'ok',
        date: r.date,
      })),
    };
  }

  if (seg === 'time') {
    const vals = series.map((r) => dailyTimePerQuestionSec(r));
    const numericVals = vals.filter((v) => v != null && Number.isFinite(v));
    if (numericVals.length === 0) return null;
    const seriesMax = Math.max(...numericVals, 1);
    const chartMax = chartMaxWithHeadroom(seriesMax);
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
  if (trendMetric === 'completion') {
    const denom = dailySessionsCount(row);
    const num = typeof row.completions === 'number' ? row.completions : dailySubmissionsCount(row);
    return denom > 0 ? Math.round((num / denom) * 100) : 0;
  }
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

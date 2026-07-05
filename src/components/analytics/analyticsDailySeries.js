/** Completed submissions for a daily series row (never opened/started sessions). */
export function dailySubmissionsCount(row) {
  if (row == null) return 0;
  if (typeof row.submissions === 'number') return row.submissions;
  if (typeof row.submitted === 'number') return row.submitted;
  if (typeof row.count === 'number') return row.count;
  return 0;
}

/** Sessions that started but may not have submitted — used as completion denominator when present. */
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

export function niceRoundChartMax(max, { step = 5, min = 1 } = {}) {
  const safe = Math.max(max, min);
  if (safe <= min) return min;
  const magnitude = 10 ** Math.floor(Math.log10(safe));
  const normalized = safe / magnitude;
  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  let rounded = nice * magnitude;
  if (rounded < safe) {
    rounded = Math.ceil(safe / step) * step;
  }
  return Math.max(rounded, min);
}

export function buildYTicks(chartMax, tickCount = 5) {
  const max = Math.max(chartMax, 1);
  const steps = tickCount - 1;
  const rawStep = max / steps;
  const step = niceRoundChartMax(rawStep, { step: max <= 10 ? 1 : 5, min: 1 });
  const ticks = [];
  for (let i = steps; i >= 0; i -= 1) {
    const v = Math.round((step * i) * 10) / 10;
    ticks.push(String(v));
  }
  if (ticks[ticks.length - 1] !== '0') ticks.push('0');
  return [...new Set(ticks)];
}

function toTier(val, max) {
  if (val == null || !Number.isFinite(val)) return 'warn';
  const ratio = max > 0 ? val / max : 0;
  if (ratio < 0.2) return 'bad';
  if (ratio < 0.5) return 'warn';
  return 'ok';
}

export function dailyTimePerQuestionSec(row) {
  if (typeof row?.avgTimePerQuestionSec === 'number' && row.avgTimePerQuestionSec > 0) {
    return row.avgTimePerQuestionSec;
  }
  if (row?.avgDuration && row.avgDuration > 0) return Math.round(row.avgDuration / 1000);
  return null;
}

/**
 * Build bar chart data for Performance tab daily charts.
 * @returns {{ bars: Array, chartMax: number, yTicks: string[] } | null}
 */
export function buildDailyChartPanel(series, seg) {
  if (!Array.isArray(series) || series.length === 0) return null;

  if (seg === 'responses') {
    const vals = series.map((r) => dailySubmissionsCount(r));
    const seriesMax = Math.max(...vals, 0);
    if (seriesMax === 0 && vals.every((v) => v === 0)) {
      return {
        bars: series.map((r) => ({
          label: formatDailyDateLabel(r.date),
          value: 0,
          tier: 'warn',
          date: r.date,
        })),
        chartMax: 5,
        yTicks: buildYTicks(5),
      };
    }
    const chartMax = niceRoundChartMax(seriesMax, { step: seriesMax <= 10 ? 1 : 5 });
    const tierMax = Math.max(...vals, 1);
    return {
      chartMax,
      yTicks: buildYTicks(chartMax),
      bars: series.map((r) => {
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
      bars: series.map((r, i) => {
        const val = vals[i];
        return {
          label: formatDailyDateLabel(r.date),
          value: val,
          tier: val < 40 ? 'bad' : val < 65 ? 'warn' : 'ok',
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
    const chartMax = niceRoundChartMax(seriesMax, { step: seriesMax <= 10 ? 1 : 5 });
    const tierMax = Math.max(...numericVals, 1);
    return {
      chartMax,
      yTicks: buildYTicks(chartMax),
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

/** Compare tab: extract metric values from daily series rows. */
export function dailyMetricValue(row, trendMetric) {
  if (trendMetric === 'responses') return dailySubmissionsCount(row);
  if (trendMetric === 'completion') {
    const denom = dailySessionsCount(row);
    const num = typeof row.completions === 'number' ? row.completions : dailySubmissionsCount(row);
    return denom > 0 ? Math.round((num / denom) * 100) : 0;
  }
  return dailyTimePerQuestionSec(row);
}

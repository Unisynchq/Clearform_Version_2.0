/**
 * Single source of truth for performance analytics KPIs and chart scaling.
 * All dashboard cards should derive rates from funnel + completed submission counts.
 */

export const BAR_PLOT_HEIGHT_PX = 134;
export const BAR_TARGET_FILL_RATIO = 0.75;

/** Completed submissions — same definition as funnel `submitted`. */
export function completedSubmissions(apiStats) {
  if (!apiStats || apiStats.source) return 0;
  const funnel = apiStats.funnel ?? {};
  return apiStats.responses ?? funnel.submitted ?? 0;
}

export function funnelReached(apiStats) {
  const funnel = apiStats?.funnel ?? {};
  return funnel.reached ?? 0;
}

export function funnelStarted(apiStats) {
  const funnel = apiStats?.funnel ?? {};
  return funnel.started ?? 0;
}

/**
 * Reach → submit conversion (%). Matches funnel "Conversion" tile.
 * Ignores backend `completionRate` when it uses a different denominator.
 */
export function funnelCompletionRatePct(apiStats) {
  if (!apiStats || apiStats.source) return null;
  const submitted = completedSubmissions(apiStats);
  const reached = funnelReached(apiStats);
  if (reached <= 0) return submitted > 0 ? 100 : 0;
  return Math.round((submitted / reached) * 1000) / 10;
}

export function formatSecondsLabel(totalSec) {
  if (totalSec == null || !Number.isFinite(totalSec) || totalSec <= 0) return '—';
  const sec = Math.round(totalSec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

/**
 * Average seconds per question from real interaction data only.
 * Prefers API aggregate, then daily series, then per-screen drop-off dwell times.
 */
export function aggregateAvgTimePerQuestionSec(apiStats) {
  if (!apiStats || apiStats.source) return null;

  if (
    typeof apiStats.avgTimePerQuestionSec === 'number'
    && apiStats.avgTimePerQuestionSec > 0
  ) {
    return Math.round(apiStats.avgTimePerQuestionSec);
  }

  const series = apiStats.dailySeries ?? [];
  const fromDaily = series
    .map((row) =>
      typeof row?.avgTimePerQuestionSec === 'number' && row.avgTimePerQuestionSec > 0
        ? row.avgTimePerQuestionSec
        : null,
    )
    .filter((v) => v != null);
  if (fromDaily.length > 0) {
    return Math.round(fromDaily.reduce((a, b) => a + b, 0) / fromDaily.length);
  }

  const screens = apiStats.screenDropoff ?? [];
  const fromScreens = screens
    .map((s) => (typeof s.avgTimeSeconds === 'number' && s.avgTimeSeconds > 0 ? s.avgTimeSeconds : null))
    .filter((v) => v != null);
  if (fromScreens.length > 0) {
    return Math.round(fromScreens.reduce((a, b) => a + b, 0) / fromScreens.length);
  }

  return null;
}

/** Pixel height for a bar so the tallest value fills ~60–80% of the plot. */
export function barHeightPx(value, chartMax, plotHeight = BAR_PLOT_HEIGHT_PX) {
  const safeVal = Number.isFinite(value) ? value : 0;
  const max = Math.max(chartMax, 1);
  if (safeVal <= 0) return 0;
  const px = Math.round((safeVal / max) * plotHeight);
  return Math.max(px, 4);
}

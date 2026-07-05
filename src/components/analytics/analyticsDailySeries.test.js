import { describe, expect, it } from 'vitest';
import {
  averageDailySubmissions,
  buildDailyChartPanel,
  chartMaxForBarScale,
  chartMaxWithHeadroom,
  dailyCompletionRatePct,
  dailySubmissionsCount,
  sanitizeDailySeriesForSubmissions,
} from './analyticsDailySeries';
import { BAR_PLOT_HEIGHT_PX, barHeightPx } from './analyticsMetrics';

describe('dailySubmissionsCount', () => {
  it('prefers submissions and completions over raw count', () => {
    expect(dailySubmissionsCount({ submissions: 2, count: 50 })).toBe(2);
    expect(dailySubmissionsCount({ completions: 2, count: 50 })).toBe(2);
  });
});

describe('dailyCompletionRatePct', () => {
  it('uses reached as denominator when available', () => {
    expect(dailyCompletionRatePct({ completions: 2, reached: 50 })).toBe(4);
  });

  it('does not treat submission count as denominator', () => {
    expect(dailyCompletionRatePct({ completions: 2, submissions: 2 })).toBeNull();
  });
});

describe('sanitizeDailySeriesForSubmissions', () => {
  it('zeros session-like counts when funnel total is much lower', () => {
    const series = [
      { date: '2026-01-01', count: 50 },
      { date: '2026-01-02', count: 48 },
    ];
    const out = sanitizeDailySeriesForSubmissions(series, 2);
    expect(out.every((r) => dailySubmissionsCount(r) === 0)).toBe(true);
  });

  it('uses completions when they match funnel total', () => {
    const series = [
      { date: '2026-01-01', count: 50, completions: 2 },
      { date: '2026-01-02', count: 40, completions: 0 },
    ];
    const out = sanitizeDailySeriesForSubmissions(series, 2);
    expect(dailySubmissionsCount(out[0])).toBe(2);
  });
});

describe('buildDailyChartPanel responses', () => {
  it('scales Y axis for small submission counts', () => {
    const series = [{ date: '2026-01-01', submissions: 2 }];
    const panel = buildDailyChartPanel(series, 'responses', { totalSubmitted: 2 });
    expect(panel.chartMax).toBeLessThanOrEqual(5);
    const h = barHeightPx(panel.bars[0].value, panel.chartMax, BAR_PLOT_HEIGHT_PX);
    expect(h / BAR_PLOT_HEIGHT_PX).toBeGreaterThan(0.55);
  });

  it('does not overflow bar height when count was inflated', () => {
    const series = [{ date: '2026-01-01', count: 50 }];
    const panel = buildDailyChartPanel(series, 'responses', { totalSubmitted: 2 });
    expect(panel.bars[0].value).toBe(0);
  });
});

describe('buildDailyChartPanel completion', () => {
  it('uses dynamic axis for low completion percentages', () => {
    const series = [{ date: '2026-01-01', completions: 2, reached: 50 }];
    const panel = buildDailyChartPanel(series, 'completion', { totalSubmitted: 2 });
    expect(panel.chartMax).toBeLessThan(100);
    expect(panel.bars[0].value).toBe(4);
    const h = barHeightPx(panel.bars[0].value, panel.chartMax, BAR_PLOT_HEIGHT_PX);
    expect(h / BAR_PLOT_HEIGHT_PX).toBeGreaterThan(0.55);
  });
});

describe('chartMaxForBarScale', () => {
  it('keeps small maxes readable', () => {
    expect(chartMaxForBarScale(2)).toBeLessThanOrEqual(5);
  });
});

describe('chartMaxWithHeadroom', () => {
  it('keeps small maxes readable', () => {
    expect(chartMaxWithHeadroom(2)).toBeLessThanOrEqual(5);
  });
});

describe('averageDailySubmissions', () => {
  it('averages sanitized submission counts', () => {
    const series = [
      { date: '2026-01-01', submissions: 1 },
      { date: '2026-01-02', submissions: 1 },
    ];
    expect(averageDailySubmissions(series, 2)).toBe('1.0');
  });
});

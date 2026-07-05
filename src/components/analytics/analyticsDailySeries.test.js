import { describe, expect, it } from 'vitest';
import {
  buildDailyChartPanel,
  buildYTicks,
  dailyMetricValue,
  dailySubmissionsCount,
  niceRoundChartMax,
} from './analyticsDailySeries';

describe('dailySubmissionsCount', () => {
  it('prefers submissions over legacy count', () => {
    expect(dailySubmissionsCount({ submissions: 3, count: 50 })).toBe(3);
    expect(dailySubmissionsCount({ submitted: 7, count: 1 })).toBe(7);
    expect(dailySubmissionsCount({ count: 12 })).toBe(12);
  });
});

describe('buildDailyChartPanel responses', () => {
  it('uses dynamic chart max so bars do not exceed 100% height', () => {
    const series = [{ date: '2026-01-01', count: 50 }, { date: '2026-01-02', count: 25 }];
    const panel = buildDailyChartPanel(series, 'responses');
    expect(panel.chartMax).toBeGreaterThanOrEqual(50);
    const tallBar = panel.bars[0];
    const hPct = (tallBar.value / panel.chartMax) * 100;
    expect(hPct).toBeLessThanOrEqual(100);
  });

  it('computes completion rate with sessions denominator when present', () => {
    const series = [{ date: '2026-01-01', sessions: 10, completions: 4 }];
    const panel = buildDailyChartPanel(series, 'completion');
    expect(panel.bars[0].value).toBe(40);
  });
});

describe('dailyMetricValue', () => {
  it('aligns compare tab time metric with avgTimePerQuestionSec', () => {
    expect(
      dailyMetricValue({ date: '2026-01-01', avgTimePerQuestionSec: 14, avgDuration: 90000 }, 'avgTime'),
    ).toBe(14);
  });
});

describe('niceRoundChartMax', () => {
  it('rounds up high values to readable ticks', () => {
    expect(niceRoundChartMax(47)).toBeGreaterThanOrEqual(47);
    expect(buildYTicks(50).length).toBeGreaterThan(1);
  });
});

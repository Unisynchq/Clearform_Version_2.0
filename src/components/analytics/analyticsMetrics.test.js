import { describe, expect, it } from 'vitest';
import {
  BAR_PLOT_HEIGHT_PX,
  aggregateAvgTimePerQuestionSec,
  barHeightPx,
  funnelCompletionRatePct,
} from './analyticsMetrics';
import { chartMaxForBarScale } from './analyticsDailySeries';

describe('funnelCompletionRatePct', () => {
  it('uses submitted over reached (reach → submit)', () => {
    expect(
      funnelCompletionRatePct({
        responses: 2,
        funnel: { reached: 50, opened: 50, started: 50, submitted: 2 },
      }),
    ).toBe(4);
  });

  it('ignores backend completionRate when funnel is present', () => {
    expect(
      funnelCompletionRatePct({
        responses: 2,
        completionRate: 100,
        funnel: { reached: 50, submitted: 2 },
      }),
    ).toBe(4);
  });
});

describe('barHeightPx', () => {
  it('scales tallest bar to ~60–80% of plot height', () => {
    const chartMax = chartMaxForBarScale(2);
    const h = barHeightPx(2, chartMax);
    const ratio = h / BAR_PLOT_HEIGHT_PX;
    expect(ratio).toBeGreaterThan(0.55);
    expect(ratio).toBeLessThanOrEqual(0.85);
  });
});

describe('aggregateAvgTimePerQuestionSec', () => {
  it('prefers avgTimePerQuestionSec over session duration', () => {
    expect(
      aggregateAvgTimePerQuestionSec({
        avgTimePerQuestionSec: 12,
        avgDurationMs: 120000,
      }),
    ).toBe(12);
  });

  it('does not fall back to avgDurationMs', () => {
    expect(
      aggregateAvgTimePerQuestionSec({
        avgDurationMs: 120000,
        dailySeries: [],
      }),
    ).toBeNull();
  });

  it('averages per-screen dwell times when aggregate missing', () => {
    expect(
      aggregateAvgTimePerQuestionSec({
        screenDropoff: [{ avgTimeSeconds: 8 }, { avgTimeSeconds: 12 }],
      }),
    ).toBe(10);
  });
});

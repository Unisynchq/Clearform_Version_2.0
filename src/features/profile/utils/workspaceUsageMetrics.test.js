import { describe, it, expect } from 'vitest';
import {
  countResponsesThisMonth,
  getWorkspaceUsageMetrics,
  sumFormResponseCounts,
} from './workspaceUsageMetrics';

describe('workspaceUsageMetrics', () => {
  it('counts responses in current month from records', () => {
    const now = new Date();
    const map = {
      '1': [{ submittedAt: now.toISOString() }],
      '2': [{ submittedAt: new Date(2000, 0, 1).toISOString() }],
    };
    expect(countResponsesThisMonth(map)).toBe(1);
  });

  it('uses form totals when no monthly records', () => {
    const metrics = getWorkspaceUsageMetrics({
      forms: [{ id: 1, responses: 12 }, { id: 2, responses: 8 }],
      email: null,
      responsesByFormId: {},
    });
    expect(metrics.responsesUsed).toBe(20);
    expect(metrics.responsesSource).toBe('form_totals');
    expect(metrics.formsUsed).toBe(2);
  });

  it('sumFormResponseCounts aggregates forms', () => {
    expect(sumFormResponseCounts([{ responses: 3 }, { responses: 7 }])).toBe(10);
  });
});

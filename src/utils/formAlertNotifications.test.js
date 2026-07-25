import { describe, it, expect } from 'vitest';
import { evaluateFormAlerts } from './formAlertNotifications';

describe('evaluateFormAlerts', () => {
  const baseForm = {
    id: 1,
    title: 'Test Survey',
    responses: 500,
    responseLimit: 500,
    alertSettings: {
      milestone: { enabled: true, value: 100 },
      sentiment: { enabled: true, thresholdPct: 1 },
    },
  };

  it('returns milestone alert when responses meet target', () => {
    const items = evaluateFormAlerts(baseForm);
    const milestone = items.find((i) => i.dedupeKey === 'alert:1:milestone');
    expect(milestone?.active).toBe(true);
    expect(milestone?.notification.title).toBe('Response milestone reached');
  });
});

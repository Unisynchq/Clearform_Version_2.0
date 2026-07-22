import { describe, it, expect } from 'vitest';
import { evaluateFormAlerts } from './formAlertNotifications';

describe('evaluateFormAlerts', () => {
  const baseForm = {
    id: 1,
    title: 'Test Survey',
    responses: 500,
    responseLimit: 500,
    alertSettings: {
      completion: { enabled: true, thresholdPct: 50 },
      milestone: { enabled: true, value: 100 },
      sentiment: { enabled: true, thresholdPct: 1 },
    },
  };

  it('returns completion alert when conversion is below threshold', () => {
    const items = evaluateFormAlerts(baseForm);
    const completion = items.find((i) => i.dedupeKey === 'alert:1:completion');
    expect(completion).toBeDefined();
    expect(completion.active).toBe(true);
    expect(completion.notification.title).toBe('Completion rate dropped');
  });

  it('returns milestone alert when responses meet target', () => {
    const items = evaluateFormAlerts(baseForm);
    const milestone = items.find((i) => i.dedupeKey === 'alert:1:milestone');
    expect(milestone?.active).toBe(true);
    expect(milestone?.notification.title).toBe('Response milestone reached');
  });

  it('marks disabled rules inactive', () => {
    const items = evaluateFormAlerts({
      ...baseForm,
      alertSettings: {
        ...baseForm.alertSettings,
        completion: { enabled: false, thresholdPct: 10 },
      },
    });
    const completion = items.find((i) => i.dedupeKey === 'alert:1:completion');
    expect(completion?.active).toBe(false);
  });
});

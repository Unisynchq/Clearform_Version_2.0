import { describe, it, expect } from 'vitest';
import { evaluateUsageLimitAlerts } from './usageLimitNotifications';

describe('evaluateUsageLimitAlerts', () => {
  it('activates forms alert at limit', () => {
    const items = evaluateUsageLimitAlerts({
      formsUsed: 3,
      responsesUsed: 50,
      teamUsed: 1,
      formsLimit: 3,
      responsesLimit: 100,
      teamLimit: 1,
      planName: 'Free',
    });
    const forms = items.find((i) => i.dedupeKey === 'system:usage:forms');
    expect(forms?.active).toBe(true);
    expect(forms?.notification?.title).toBe('Form limit reached');
  });

  it('activates responses alert when near limit', () => {
    const items = evaluateUsageLimitAlerts({
      formsUsed: 1,
      responsesUsed: 91,
      teamUsed: 1,
      formsLimit: 3,
      responsesLimit: 100,
      teamLimit: 1,
      planName: 'Free',
    });
    const responses = items.find((i) => i.dedupeKey === 'system:usage:responses');
    expect(responses?.active).toBe(true);
    expect(responses?.notification?.title).toBe('Approaching response limit');
  });

  it('activates team alert at cap', () => {
    const items = evaluateUsageLimitAlerts({
      formsUsed: 1,
      responsesUsed: 10,
      teamUsed: 1,
      formsLimit: 3,
      responsesLimit: 100,
      teamLimit: 1,
      planName: 'Free',
    });
    const team = items.find((i) => i.dedupeKey === 'system:usage:team');
    expect(team?.active).toBe(true);
  });
});

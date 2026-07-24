import { computeScreenDropoff } from './analytics-snapshot.util';

const snapshot = {
  screens: [
    {
      id: 1,
      type: 'content',
      label: 'Short text',
      config: { shortTextQuestion: 'Your name' },
    },
    {
      id: 2,
      type: 'content',
      label: 'Long text',
      config: { longTextQuestion: 'Feedback' },
    },
    {
      id: 3,
      type: 'content',
      label: 'Rating',
      config: { ratingQuestion: 'Score us' },
    },
  ],
};

describe('computeScreenDropoff', () => {
  it('does not mark unreachable steps with −100% when partial progress', () => {
    const rows = Array.from({ length: 13 }, () => ({
      payload: {
        answersByScreenId: {
          '1': { shortTextDraft: 'Alex' },
        },
      },
      durationMs: 8000,
      status: 'ABANDONED',
    }));

    const steps = computeScreenDropoff(snapshot, rows);
    expect(steps[0].reached).toBe(13);
    expect(steps[0].label).toBe('Your name');
    expect(steps[1].reached).toBe(0);
    expect(steps[1].dropPercent).toBe(0);
    expect(steps[1].drop).toBeNull();
    expect(steps[2].dropPercent).toBe(0);
  });

  it('handles five starts with three completions without −100% on every step', () => {
    const completed = Array.from({ length: 3 }, (_, i) => ({
      payload: {
        answersByScreenId: {
          '1': { shortTextDraft: `User ${i}` },
          '2': { longTextDraft: 'Detailed feedback here with enough words.' },
          '3': { ratingValue: 4 },
        },
      },
      durationMs: 90_000,
      status: 'PROCESSED',
    }));
    const abandoned = Array.from({ length: 2 }, (_, i) => ({
      payload: {
        answersByScreenId: {
          '1': { shortTextDraft: `Drop ${i}` },
        },
      },
      durationMs: 12_000,
      status: 'ABANDONED',
    }));
    const steps = computeScreenDropoff(snapshot, [...completed, ...abandoned]);
    expect(steps[0].reached).toBe(5);
    expect(steps[0].dropPercent).toBeLessThan(100);
    expect(steps[2].reached).toBe(3);
    expect(steps[2].dropPercent).toBe(0);
  });

  it('computes drop between answered steps', () => {
    const rows = [
      {
        payload: {
          answersByScreenId: {
            '1': { shortTextDraft: 'A' },
            '2': { longTextDraft: 'Good' },
          },
        },
        durationMs: 12000,
        status: 'PROCESSED',
      },
      {
        payload: {
          answersByScreenId: {
            '1': { shortTextDraft: 'B' },
          },
        },
        durationMs: 5000,
        status: 'ABANDONED',
      },
    ];

    const steps = computeScreenDropoff(snapshot, rows);
    expect(steps[0].reached).toBe(2);
    expect(steps[0].continued).toBe(1);
    expect(steps[0].dropPercent).toBe(50);
    expect(steps[1].reached).toBe(1);
    expect(steps[1].insight).toContain('Feedback');
  });
});

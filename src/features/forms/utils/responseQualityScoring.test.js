import { describe, expect, it } from 'vitest';
import { evaluateResponseQuality } from './responseQualityScoring';

const relevanceOnly = {
  enabled: true,
  options: {
    length: { enabled: false },
    specificity: { enabled: false },
    relevance: { enabled: true, keywords: '' },
    completeness: { enabled: false },
  },
};

describe('evaluateResponseQuality relevance', () => {
  it('passes a two-word name on identity-style short text questions', () => {
    const result = evaluateResponseQuality('Rahul Pandey', {
      ...relevanceOnly,
      fieldKind: 'shortText',
      question: "What's your name?",
    });
    expect(result?.level).toBe('green');
    expect(result?.failCount).toBe(0);
  });

  it('still flags answers that miss configured topic keywords', () => {
    const result = evaluateResponseQuality('ok', {
      enabled: true,
      options: {
        length: { enabled: false },
        specificity: { enabled: false },
        relevance: {
          enabled: true,
          keywords: 'experience, product, feedback',
          matchThreshold: 1,
        },
        completeness: { enabled: false },
      },
      fieldKind: 'longText',
      question: 'Describe your experience with our product',
    });
    expect(result?.failCount).toBeGreaterThan(0);
    expect(result?.failedIds).toContain('relevance');
  });
});

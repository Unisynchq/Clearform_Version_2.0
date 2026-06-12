import { describe, expect, it } from 'vitest';
import {
  evaluateResponseQuality,
  hasKeyboardMashSegment,
} from './responseQualityScoring';

const MASH_ANSWER =
  'need to be fnkjewdbkjknewlkvklkslnvnwdvml;wenlivwonvw;djvohewohfgoi23hpofp2yoc 3ojpoh|';

const EXPERIENCE_QUESTION =
  'How is your experience filling out this form? Share any feedback.';

/** Outreach builder: specificity + completeness only (length/relevance disabled). */
const outreachOptions = {
  enabled: true,
  options: {
    length: { enabled: false },
    specificity: { enabled: true, sensitivity: 'Medium' },
    relevance: { enabled: false },
    completeness: { enabled: true, detectTrailing: true, requiredSentences: 1 },
  },
  fieldKind: 'longText',
  question: EXPERIENCE_QUESTION,
};

describe('evaluateResponseQuality regression', () => {
  it('flags keyboard mash segments', () => {
    expect(hasKeyboardMashSegment(MASH_ANSWER)).toBe(true);
  });

  it('returns red for keyboard mash answer', () => {
    const result = evaluateResponseQuality(MASH_ANSWER, {
      ...outreachOptions,
      question: 'What is your goal in life?',
    });
    expect(result?.level).toBe('red');
  });

  it('does not red-flag a substantive career goal answer', () => {
    const result = evaluateResponseQuality(
      'I want to be a Software Engineer but what i am doing is correct',
      {
        ...outreachOptions,
        question: 'What is your goal in life?',
      },
    );
    expect(result?.level).not.toBe('red');
  });

  it('returns amber for vague informal praise on experience question', () => {
    const result = evaluateResponseQuality("Not much ..it's good", outreachOptions);
    expect(result?.level).toBe('amber');
  });

  it('returns amber for fun bro informal praise on experience question', () => {
    const result = evaluateResponseQuality(
      'I was fun bro and i kinda like it a lot',
      outreachOptions,
    );
    expect(result?.level).toBe('amber');
  });
});

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
    const result = evaluateResponseQuality('Yeah sure whatever', {
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

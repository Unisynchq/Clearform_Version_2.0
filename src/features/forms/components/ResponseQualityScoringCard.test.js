import { describe, expect, it } from 'vitest';
import {
  AI_GUIDANCE_MAX_LENGTH,
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
  normalizeResponseQualityOptions,
} from './ResponseQualityScoringCard';

function criterionEntries(options) {
  return Object.entries(options).filter(([key]) => key !== 'customInstructions');
}

describe('DEFAULT_RESPONSE_QUALITY_OPTIONS', () => {
  it('defaults all criteria to collapsed', () => {
    for (const [, criterion] of criterionEntries(DEFAULT_RESPONSE_QUALITY_OPTIONS)) {
      expect(criterion.expanded).toBe(false);
    }
  });

  it('defaults customInstructions to an empty string', () => {
    expect(DEFAULT_RESPONSE_QUALITY_OPTIONS.customInstructions).toBe('');
  });
});

describe('normalizeResponseQualityOptions', () => {
  it('forces expanded false on every criterion', () => {
    const normalized = normalizeResponseQualityOptions({
      length: { enabled: true, expanded: true, minWords: 5 },
      completeness: { enabled: false, expanded: true },
    });
    for (const [, criterion] of criterionEntries(normalized)) {
      expect(criterion.expanded).toBe(false);
    }
    expect(normalized.length.minWords).toBe(5);
  });

  it('preserves customInstructions and caps its length', () => {
    const normalized = normalizeResponseQualityOptions({
      customInstructions: 'One-word colour answers are perfect.',
    });
    expect(normalized.customInstructions).toBe('One-word colour answers are perfect.');

    const long = normalizeResponseQualityOptions({
      customInstructions: 'x'.repeat(AI_GUIDANCE_MAX_LENGTH + 100),
    });
    expect(long.customInstructions).toHaveLength(AI_GUIDANCE_MAX_LENGTH);

    const missing = normalizeResponseQualityOptions({});
    expect(missing.customInstructions).toBe('');
  });
});

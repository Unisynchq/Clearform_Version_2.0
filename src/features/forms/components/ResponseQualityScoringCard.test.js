import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
  normalizeResponseQualityOptions,
} from './ResponseQualityScoringCard';

describe('DEFAULT_RESPONSE_QUALITY_OPTIONS', () => {
  it('defaults all criteria to collapsed', () => {
    for (const criterion of Object.values(DEFAULT_RESPONSE_QUALITY_OPTIONS)) {
      expect(criterion.expanded).toBe(false);
    }
  });
});

describe('normalizeResponseQualityOptions', () => {
  it('forces expanded false on every criterion', () => {
    const normalized = normalizeResponseQualityOptions({
      length: { enabled: true, expanded: true, minWords: 5 },
      completeness: { enabled: false, expanded: true },
    });
    for (const criterion of Object.values(normalized)) {
      expect(criterion.expanded).toBe(false);
    }
    expect(normalized.length.minWords).toBe(5);
  });
});

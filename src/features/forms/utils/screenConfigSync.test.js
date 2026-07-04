import { describe, expect, it } from 'vitest';
import { getDefaultScreenConfig } from './screenConfigSync';

describe('getDefaultScreenConfig', () => {
  it('returns blank short text defaults with fresh response quality options', () => {
    const first = getDefaultScreenConfig('Short text');
    const second = getDefaultScreenConfig('Short text');

    expect(first.shortTextQuestion).toBe('');
    expect(first.shortTextHelperText).toBe('');
    expect(first.shortTextResponseQualityEnabled).toBe(false);
    expect(first.shortTextResponseQualityOptions.customInstructions).toBe('');

    first.shortTextQuestion = 'Question A';
    first.shortTextResponseQualityOptions.customInstructions = 'Prefer detail';

    expect(second.shortTextQuestion).toBe('');
    expect(second.shortTextResponseQualityOptions.customInstructions).toBe('');
  });

  it('returns blank long text defaults independent of short text', () => {
    const short = getDefaultScreenConfig('Short text');
    const long = getDefaultScreenConfig('Long text');

    short.shortTextQuestion = 'Shared by mistake';
    short.shortTextResponseQualityOptions.customInstructions = 'Should not leak';

    expect(long.longTextQuestion).toBe('');
    expect(long.longTextResponseQualityOptions.customInstructions).toBe('');
  });
});

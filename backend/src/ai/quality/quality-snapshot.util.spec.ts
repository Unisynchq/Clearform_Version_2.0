import {
  customInstructionsFromScreen,
  extractQualityContextFromScreen,
  qualityOptionsFromScreen,
} from './quality-snapshot.util';

describe('quality-snapshot.util', () => {
  const guidance =
    'This question is for understanding the person better — what they do, what they studied.';

  const screenWithFieldKindOptions = {
    id: 3,
    config: {
      shortTextResponseQualityOptions: {
        customInstructions: guidance,
        length: { enabled: true, minWords: 5 },
      },
      longTextResponseQualityOptions: {
        customInstructions: 'long-text guidance',
      },
    },
  };

  const screenWithLegacyOptions = {
    id: 4,
    config: {
      quality: { customInstructions: guidance, minWords: 3 },
    },
  };

  it('prefers the field-kind options matching the field being evaluated', () => {
    expect(
      qualityOptionsFromScreen(screenWithFieldKindOptions, 'short-text'),
    ).toMatchObject({ customInstructions: guidance });
    expect(
      qualityOptionsFromScreen(screenWithFieldKindOptions, 'long-text'),
    ).toMatchObject({ customInstructions: 'long-text guidance' });
  });

  it('falls back to legacy keys', () => {
    expect(qualityOptionsFromScreen(screenWithLegacyOptions)).toMatchObject({
      minWords: 3,
    });
  });

  it('extracts trimmed, capped owner guidance', () => {
    const screen = {
      config: {
        quality: { customInstructions: `  ${'x'.repeat(700)}  ` },
      },
    };
    const extracted = customInstructionsFromScreen(screen);
    expect(extracted).toHaveLength(600);
  });

  it('returns undefined guidance when absent or blank', () => {
    expect(
      customInstructionsFromScreen({ config: { quality: {} } }),
    ).toBeUndefined();
    expect(
      customInstructionsFromScreen({
        config: { quality: { customInstructions: '   ' } },
      }),
    ).toBeUndefined();
  });

  it('yields identical context for live and async callers (same screen JSON)', () => {
    // The live controller passes fieldId; the async processor does not.
    // For legacy-key screens both must see the same guidance.
    const live = extractQualityContextFromScreen(
      screenWithLegacyOptions,
      'short-text',
    );
    const async = extractQualityContextFromScreen(screenWithLegacyOptions);
    expect(live).toEqual(async);
    expect(live.customInstructions).toBe(guidance);
  });
});

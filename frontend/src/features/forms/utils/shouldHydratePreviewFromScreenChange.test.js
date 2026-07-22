import { describe, expect, it } from 'vitest';
import { shouldHydratePreviewFromScreenChange } from './shouldHydratePreviewFromScreenChange';

describe('shouldHydratePreviewFromScreenChange', () => {
  it('hydrates when preview screen id changes', () => {
    expect(shouldHydratePreviewFromScreenChange(1, 2, true)).toBe(true);
    expect(shouldHydratePreviewFromScreenChange(null, 2, true)).toBe(true);
  });

  it('does not hydrate when screen id is unchanged (e.g. keystroke parent update)', () => {
    expect(shouldHydratePreviewFromScreenChange(2, 2, true)).toBe(false);
  });

  it('does not hydrate outside preview mode', () => {
    expect(shouldHydratePreviewFromScreenChange(1, 2, false)).toBe(false);
  });

  it('does not hydrate when next screen id is missing', () => {
    expect(shouldHydratePreviewFromScreenChange(1, null, true)).toBe(false);
  });
});

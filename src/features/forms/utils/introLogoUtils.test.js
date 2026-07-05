import { describe, expect, it } from 'vitest';
import { isDurableIntroLogoUrl, resolveIntroLogoUrl } from './introLogoUtils';

describe('introLogoUtils', () => {
  it('rejects blob URLs', () => {
    expect(isDurableIntroLogoUrl('blob:http://localhost/abc')).toBe(false);
  });

  it('accepts data and asset URLs', () => {
    expect(isDurableIntroLogoUrl('data:image/png;base64,abc')).toBe(true);
    expect(isDurableIntroLogoUrl('/assets/logo.png')).toBe(true);
  });

  it('falls back when logo is not durable', () => {
    const fallback = '/assets/default.png';
    expect(resolveIntroLogoUrl('blob:dead', fallback)).toBe(fallback);
    expect(resolveIntroLogoUrl('data:image/png;base64,x', fallback)).toBe('data:image/png;base64,x');
  });
});

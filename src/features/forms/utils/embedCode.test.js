import { describe, it, expect } from 'vitest';
import { normalizeEmbedSrc, buildEmbedCode } from './embedCode';

describe('normalizeEmbedSrc', () => {
  it('upgrades http -> https for non-local hosts', () => {
    expect(normalizeEmbedSrc('http://app.clearform.in/f/abc')).toBe(
      'https://app.clearform.in/f/abc',
    );
  });

  it('leaves https URLs unchanged', () => {
    expect(normalizeEmbedSrc('https://app.clearform.in/f/abc')).toBe(
      'https://app.clearform.in/f/abc',
    );
  });

  it('keeps http for localhost dev origins', () => {
    expect(normalizeEmbedSrc('http://localhost:3000/f/abc')).toBe(
      'http://localhost:3000/f/abc',
    );
    expect(normalizeEmbedSrc('http://127.0.0.1:5173/f/abc')).toBe(
      'http://127.0.0.1:5173/f/abc',
    );
  });

  it('resolves relative URLs against the app origin', () => {
    expect(normalizeEmbedSrc('/f/abc')).toBe(
      `${window.location.origin}/f/abc`,
    );
  });

  it('returns falsy input untouched', () => {
    expect(normalizeEmbedSrc('')).toBe('');
    expect(normalizeEmbedSrc(undefined)).toBeUndefined();
  });
});

describe('buildEmbedCode', () => {
  it('emits an iframe whose src is the normalized URL with fluid responsive styles', () => {
    const code = buildEmbedCode('http://app.clearform.in/f/abc');
    expect(code).toContain('src="https://app.clearform.in/f/abc"');
    expect(code).toContain('width="100%"');
    expect(code).toContain('height="100%"');
    expect(code).toContain('style="width: 100%; height: 100%; min-height: 500px; border: 0;"');
    expect(code).toContain('frameborder="0"');
    expect(code).toContain('allow="fullscreen"');
  });
});

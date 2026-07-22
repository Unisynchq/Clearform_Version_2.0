import {
  copyKeys,
  copyVariants,
  normalizeCopy,
  parseCopyMarkdown,
  pickCopy,
} from './copy.registry';

/**
 * Structural guarantees for src/ai/doctrine/copy/quality-messages.md —
 * permanent fix for "red and green show the same message".
 */
describe('quality-messages copy file', () => {
  const keys = copyKeys();

  it('loads a non-empty copy map from disk', () => {
    expect(keys.length).toBeGreaterThan(10);
  });

  it('every key has at least 2 variants (repeat-avoidance needs choice)', () => {
    for (const key of keys) {
      expect({ key, count: copyVariants(key).length }).toEqual({
        key,
        count: expect.any(Number),
      });
      expect(copyVariants(key).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('no normalized string appears under two different levels', () => {
    const byPrefix = (prefix: string) =>
      keys
        .filter((k) => k.startsWith(prefix))
        .flatMap((k) => copyVariants(k))
        .map(normalizeCopy);
    const green = new Set(byPrefix('green.'));
    const amber = byPrefix('amber.');
    const red = byPrefix('red.');
    const violation = byPrefix('violation.');

    for (const text of [...amber, ...red, ...violation]) {
      expect(green.has(text)).toBe(false);
    }
    const redSet = new Set(red);
    for (const text of amber) {
      expect(redSet.has(text)).toBe(false);
    }
  });

  it('declared template vars are covered by callers', () => {
    const varsUsed = new Map<string, Set<string>>();
    for (const key of keys) {
      for (const variant of copyVariants(key)) {
        for (const match of variant.matchAll(/\{\{(\w+)\}\}/g)) {
          if (!varsUsed.has(key)) varsUsed.set(key, new Set());
          varsUsed.get(key)!.add(match[1]);
        }
      }
    }
    // Callers pass exactly these vars — extend this map when adding new ones.
    const known: Record<string, string[]> = {
      'amber.length': ['minWords'],
      'amber.guidance_unverified': [],
      'green.name_complete': ['excerpt'],
      'green.artifact_named': ['excerpt'],
      'green.project_specific': ['excerpt'],
      'green.near_complete': ['excerpt', 'missingFacet'],
      'violation.profanity': ['reader'],
      'violation.profanity.repeat': ['reader'],
      'suggestion.off_topic': ['question'],
    };
    for (const [key, vars] of varsUsed) {
      expect({ key, vars: [...vars].sort() }).toEqual({
        key,
        vars: (known[key] ?? []).sort(),
      });
    }
  });

  it('every .repeat variant references the earlier occurrence', () => {
    for (const key of keys.filter((k) => k.endsWith('.repeat'))) {
      for (const variant of copyVariants(key)) {
        expect(
          /\b(again|before|earlier|same|still|like the|another|this time)\b/i.test(
            variant,
          ),
        ).toBe(true);
      }
    }
  });
});

describe('pickCopy', () => {
  it('is deterministic for a given seed', () => {
    const a = pickCopy('green.default', { seed: 'form1:screen2:answer' });
    const b = pickCopy('green.default', { seed: 'form1:screen2:answer' });
    expect(a).toBe(b);
  });

  it('skips excluded variants when alternatives exist', () => {
    const first = pickCopy('green.default', { seed: 'x' });
    const second = pickCopy('green.default', { seed: 'x', exclude: [first] });
    expect(second).not.toBe(first);
  });

  it('interpolates vars', () => {
    const msg = pickCopy('amber.length', {
      seed: 'x',
      vars: { minWords: '12' },
    });
    expect(msg).toContain('12');
    expect(msg).not.toContain('{{');
  });

  it('falls back for unknown keys', () => {
    expect(pickCopy('nope.missing', { fallback: 'fallback text' })).toBe(
      'fallback text',
    );
  });

  it('parses headings and bullets', () => {
    const map = parseCopyMarkdown('## a.b\n- one\n- two\n\n## c\n- three\n');
    expect(map.get('a.b')).toEqual(['one', 'two']);
    expect(map.get('c')).toEqual(['three']);
  });
});

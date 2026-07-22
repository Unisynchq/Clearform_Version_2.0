import {
  detectArchetype,
  detectArchetypeFromSnapshot,
} from './archetype.util';

/** Pins form-context's detection behaviour — the version live evals use. */
describe('archetype.util', () => {
  const snapshot = (over: Record<string, unknown> = {}) => ({
    title: 'Untitled',
    screens: [],
    ...over,
  });

  it('academic template ids win regardless of copy', () => {
    expect(
      detectArchetype(snapshot({ templateId: 'academic-research-v2' }), 'x', 'y'),
    ).toBe('academic-research');
  });

  it('customer NPS needs both keywords and a rating screen', () => {
    const withRating = snapshot({
      screens: [{ id: 1, type: 'content', label: 'Rating', config: {} }],
    });
    expect(
      detectArchetype(withRating, 'How likely are you to recommend us', ''),
    ).toBe('customer-nps');
    expect(
      detectArchetype(snapshot(), 'How likely are you to recommend us', ''),
    ).not.toBe('customer-nps');
  });

  it('community keywords detect club forms', () => {
    expect(detectArchetype(snapshot(), 'Volunteer signup', '')).toBe(
      'community-club',
    );
  });

  it('falls back to generic', () => {
    expect(detectArchetype(snapshot(), 'Contact us', '')).toBe('generic');
  });

  it('snapshot variant derives title/purpose from the snapshot itself', () => {
    expect(
      detectArchetypeFromSnapshot({
        title: 'Customer interview — pain points',
        screens: [],
      }),
    ).toBe('founder-product-discovery');
    expect(detectArchetypeFromSnapshot(null)).toBe('generic');
  });
});

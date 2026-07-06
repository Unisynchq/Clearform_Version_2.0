import { describe, expect, it } from 'vitest';

const MAIN_TABS = [
  { id: 'performance', label: 'Performance' },
  { id: 'responses', label: 'Responses' },
  { id: 'compare', label: 'Compare' },
  { id: 'ai', label: 'AI Insights' },
  { id: 'settings', label: 'Settings' },
];

function resolveResponsesView(paramView) {
  return paramView === 'best' ? 'best' : 'all';
}

function legacyBestTabRedirect(paramTab) {
  if (paramTab !== 'best') return null;
  return { tab: 'responses', view: 'best' };
}

describe('analytics responses view routing', () => {
  it('does not include best as a main tab', () => {
    expect(MAIN_TABS.some((tab) => tab.id === 'best')).toBe(false);
    expect(MAIN_TABS).toHaveLength(5);
  });

  it('maps view param to responses sub-view', () => {
    expect(resolveResponsesView(null)).toBe('all');
    expect(resolveResponsesView('best')).toBe('best');
    expect(resolveResponsesView('other')).toBe('all');
  });

  it('redirects legacy tab=best to responses with view=best', () => {
    expect(legacyBestTabRedirect('best')).toEqual({ tab: 'responses', view: 'best' });
    expect(legacyBestTabRedirect('responses')).toBeNull();
  });
});

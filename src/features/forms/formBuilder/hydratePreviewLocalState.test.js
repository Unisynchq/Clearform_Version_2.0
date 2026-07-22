import { describe, expect, it } from 'vitest';
import { hydratePreviewLocalState } from './BuilderContentCard';

describe('hydratePreviewLocalState', () => {
  it('maps snap fields for local preview state', () => {
    const snap = {
      previewPicks: ['Option A'],
      shortTextDraft: 'hello',
      longTextDraft: 'line1\nline2',
      ratingValue: 4,
      previewFields: { 'c.em': 'a@b.com' },
      captchaChecked: true,
      timeSelection: { hour: 9, minute: 30, period: 'AM' },
    };
    expect(hydratePreviewLocalState(snap)).toEqual({
      previewPicks: ['Option A'],
      shortTextDraft: 'hello',
      longTextDraft: 'line1\nline2',
      ratingValue: 4,
      previewFields: { 'c.em': 'a@b.com' },
      captchaChecked: true,
      timeSelection: { hour: 9, minute: 30, period: 'AM' },
    });
  });

  it('returns null for missing snap', () => {
    expect(hydratePreviewLocalState(null)).toBeNull();
  });
});

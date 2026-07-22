import { describe, it, expect } from 'vitest';
import {
  canPublishForm,
  getPublishBlockers,
  getPublishBlockersForFormId,
} from './formPublishReadiness';

describe('formPublishReadiness', () => {
  it('blocks when screens are empty', () => {
    expect(getPublishBlockers([])).toEqual(['Add at least one question before publishing.']);
    expect(canPublishForm([])).toBe(false);
  });

  it('blocks when only intro and end screens exist', () => {
    const screens = [
      { id: 1, type: 'intro' },
      { id: 2, type: 'end' },
    ];
    expect(getPublishBlockers(screens)).toHaveLength(1);
    expect(canPublishForm(screens)).toBe(false);
  });

  it('allows publish when at least one content screen exists', () => {
    const screens = [
      { id: 1, type: 'intro' },
      { id: 2, type: 'content', label: 'Short text' },
      { id: 3, type: 'end' },
    ];
    expect(getPublishBlockers(screens)).toEqual([]);
    expect(canPublishForm(screens)).toBe(true);
  });

  it('getPublishBlockersForFormId blocks when no draft exists', () => {
    expect(getPublishBlockersForFormId('nonexistent-form-id-xyz')).toEqual([
      'Add at least one question before publishing.',
    ]);
  });
});

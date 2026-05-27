import { describe, it, expect, beforeEach } from 'vitest';
import { writeJson } from '@/utils/localStorageSafe';
import { evaluateProfileSystemAlerts } from './profileSystemNotifications';

const PROFILE_KEY = 'clearform_profile_settings';

function writeProfile(email, settings) {
  writeJson(PROFILE_KEY, { [email.toLowerCase()]: settings });
}

describe('evaluateProfileSystemAlerts', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PROFILE_KEY);
    }
  });

  it('activates when display name is missing', () => {
    writeProfile('user@test.com', { displayName: '' });
    const items = evaluateProfileSystemAlerts({ email: 'user@test.com' });
    const incomplete = items.find((i) => i.dedupeKey === 'system:profile:incomplete');
    expect(incomplete?.active).toBe(true);
    expect(incomplete?.notification?.category).toBe('alerts');
  });

  it('is inactive when profile is complete', () => {
    writeProfile('user@test.com', { displayName: 'Jane Doe' });
    const items = evaluateProfileSystemAlerts({ email: 'user@test.com' });
    const incomplete = items.find((i) => i.dedupeKey === 'system:profile:incomplete');
    expect(incomplete?.active).toBe(false);
  });
});

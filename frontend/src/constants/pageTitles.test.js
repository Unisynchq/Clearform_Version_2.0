import { describe, expect, it } from 'vitest';
import { formatPageTitle, resolvePageTitle } from '@/constants/pageTitles';

describe('pageTitles', () => {
  it('formats with app name', () => {
    expect(formatPageTitle('Dashboard')).toBe('Dashboard · Clearform');
  });

  it('resolves static routes', () => {
    expect(resolvePageTitle('/dashboard/analytics')).toBe('Analytics · Clearform');
    expect(resolvePageTitle('/signin')).toBe('Sign In · Clearform');
  });

  it('uses dynamic form title on builder route', () => {
    expect(resolvePageTitle('/dashboard/form-builder/42', 'Customer Survey')).toBe(
      'Customer Survey · Clearform',
    );
  });
});

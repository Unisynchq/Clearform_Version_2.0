/** Score 0–4 for the four-segment strength meter. */
export function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', badgeLabel: 'Strong' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const level = Math.min(4, Math.max(1, score));

  if (level <= 1) {
    return {
      level: 1,
      label: 'Too weak- add numbers, symbols and uppercase letters',
      badgeLabel: 'Weak',
    };
  }
  if (level === 2) return { level: 2, label: 'Fair password', badgeLabel: 'Fair' };
  if (level === 3) return { level: 3, label: 'Strong password', badgeLabel: 'Strong' };
  return { level: 4, label: 'Strong password', badgeLabel: 'Strong' };
}

export const STRENGTH_COLORS = {
  weak: '#c53030',
  fair: '#d97706',
  good: '#2e7d52',
  strong: '#2e7d52',
  empty: '#e8e8e6',
};

export function strengthBarColor(level, index) {
  if (level === 0) return STRENGTH_COLORS.empty;
  if (index >= level) return STRENGTH_COLORS.empty;
  if (level <= 1) return STRENGTH_COLORS.weak;
  if (level === 2) return STRENGTH_COLORS.fair;
  return STRENGTH_COLORS.good;
}

export function strengthTextColor(level) {
  if (level <= 1) return STRENGTH_COLORS.weak;
  if (level === 2) return STRENGTH_COLORS.fair;
  return STRENGTH_COLORS.good;
}

export { getDefaultSessions } from '@/features/profile/utils/currentDeviceSession';

export { FREE_PLAN } from '@/features/profile/utils/profileBillingPlans';

/** Demo usage aligned with Figma (2869:1259) — responses near monthly cap. */
export const DEFAULT_BILLING_USAGE = {
  responsesThisMonth: 91,
};

export const NEAR_LIMIT_RATIO = 0.9;

export function getUsageStatus(used, limit) {
  if (limit <= 0) return 'normal';
  const ratio = used / limit;
  if (ratio >= 1) return 'at-limit';
  if (ratio >= NEAR_LIMIT_RATIO) return 'near-limit';
  return 'normal';
}

export function getUsageHint(metric, used, limit, status) {
  if (metric === 'forms') {
    const remaining = Math.max(0, limit - used);
    if (remaining === 0) return 'Form limit reached';
    if (remaining === 1) return '1 form remaining';
    return `${remaining} forms remaining`;
  }
  if (metric === 'responses') {
    if (status === 'near-limit' || status === 'at-limit') return 'Near limit — upgrade';
    return `${Math.max(0, limit - used)} responses remaining`;
  }
  if (metric === 'team') {
    if (used >= limit) return 'Upgrade to add members';
    return `${limit - used} seat available`;
  }
  return '';
}

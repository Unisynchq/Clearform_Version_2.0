import {
  readProfileSettings,
  writeProfileSettings,
} from '@/features/profile/utils/profileSettingsStorage';

/**
 * @typedef {Object} BillingSubscription
 * @property {'starter'|'pro'} planId
 * @property {'monthly'|'yearly'} interval
 * @property {number} activatedAt
 * @property {boolean} [promoApplied]
 * @property {{ paymentMethod?: string }} [paymentContext]
 * @property {string} invoiceNumber
 * @property {{ responsesThisMonth?: number, formsUsed?: number }} [usage]
 */

export function readBillingSubscription(email) {
  const settings = readProfileSettings(email);
  const billing = settings?.billing;
  if (!billing?.planId) return null;
  return billing;
}

/** @param {string} email @param {BillingSubscription} subscription */
export function writeBillingSubscription(email, subscription) {
  const existing = readProfileSettings(email) ?? {};
  writeProfileSettings(email, {
    ...existing,
    billing: subscription,
  });
}

export function clearBillingSubscription(email) {
  const existing = readProfileSettings(email) ?? {};
  const { billing: _removed, ...rest } = existing;
  writeProfileSettings(email, rest);
}

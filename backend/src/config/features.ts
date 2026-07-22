/** Pilot feature flags — adjust without refactors */
export const FEATURES = {
  paymentLinkOnly: process.env.BILLING_ALLOW_PAYMENT_LINK_CONFIRM === 'true',
} as const;

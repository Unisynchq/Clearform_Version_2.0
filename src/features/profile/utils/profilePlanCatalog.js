export const BILLING_INTERVALS = ['monthly', 'yearly'];

export const YEARLY_DISCOUNT_PERCENT = 20;

export const CHECKOUT_STEPS = [
  { id: 'plan', label: 'Plan', number: 1 },
  { id: 'payment', label: 'Payment', number: 2 },
  { id: 'confirm', label: 'Done', number: 3 },
];

/**
 * Pro / Starter monthly & yearly plans — not shipped yet.
 * Re-enable when Razorpay Subscription plans exist in Dashboard.
 */
export const PAID_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo creators & freelancers',
    monthlyPrice: 499,
    featured: false,
    ctaLabel: 'Choose Starter',
    features: [
      { text: '10 active forms', included: true },
      { text: '1,000 responses / month', included: true },
      { text: 'AI response quality scoring', included: true },
      { text: 'Remove Clearform branding', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'AI dynamic questions', included: false },
      { text: 'Team collaboration', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing teams & agencies',
    monthlyPrice: 1999,
    featured: true,
    badge: 'Most popular',
    ctaLabel: 'Choose Pro',
    features: [
      { text: 'Unlimited forms', included: true },
      { text: '10,000 responses / month', included: true },
      { text: 'AI quality scoring + AI dynamic Qs', included: true },
      { text: '5 team members', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Advanced analytics + AI insights', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

export function getPlanDisplayPrice(plan, interval) {
  const monthly =
    interval === 'yearly'
      ? Math.round(plan.monthlyPrice * (1 - YEARLY_DISCOUNT_PERCENT / 100))
      : plan.monthlyPrice;
  return monthly;
}

export function formatInr(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

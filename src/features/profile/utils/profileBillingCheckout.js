import {
  formatInr,
  getPlanDisplayPrice,
  PAID_PLANS,
} from '@/features/profile/utils/profilePlanCatalog';

export const GST_RATE = 0.18;

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'upi', label: 'UPI', icon: '⚡' },
  { id: 'netbanking', label: 'Netbanking', icon: '🏦' },
  { id: 'more', label: 'More', icon: '⋯', disabled: true },
];

export const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe' },
  { id: 'gpay', label: 'GPay' },
  { id: 'paytm', label: 'Paytm' },
  { id: 'bhim', label: 'BHIM', emoji: '🟠' },
];

export const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', color: '#0052a5' },
  { id: 'sbi', name: 'SBI', color: '#f37021' },
  { id: 'icici', name: 'ICICI Bank', color: '#c8102e' },
  { id: 'axis', name: 'Axis Bank', color: '#008cdb' },
  { id: 'kotak', name: 'Kotak Bank', color: '#1e5c9b' },
  { id: 'yes', name: 'Yes Bank', color: '#00a650' },
];

export const PROMO_CLEAR20 = {
  code: 'CLEAR20',
  discount: 400,
  /** Applied automatically on Pro card checkout per Figma. */
  autoApplyPlanIds: ['pro'],
};

export function getPaidPlan(planId) {
  return PAID_PLANS.find((p) => p.id === planId) ?? null;
}

export function getUnlockHighlights(plan) {
  if (!plan) return [];
  const map = {
    starter: [
      '10 active forms',
      '1K responses/mo',
      'AI quality scoring',
      'Remove branding',
    ],
    pro: [
      'Unlimited forms',
      '10K responses/mo',
      'AI dynamic questions',
      '5 team members',
    ],
  };
  return map[plan.id] ?? plan.features.filter((f) => f.included).map((f) => f.text);
}

/**
 * @param {{ planId: string, interval: 'monthly'|'yearly', promoApplied?: boolean }} selection
 */
export function calculateCheckoutSummary(selection) {
  const plan = getPaidPlan(selection.planId);
  if (!plan) {
    return null;
  }

  const baseMonthly = getPlanDisplayPrice(plan, selection.interval);
  const promoApplied =
    selection.promoApplied ??
    PROMO_CLEAR20.autoApplyPlanIds.includes(plan.id);
  const promoDiscount = promoApplied ? PROMO_CLEAR20.discount : 0;
  const subtotal = Math.max(0, baseMonthly - promoDiscount);
  const gst = Math.round(subtotal * GST_RATE);
  const totalToday = subtotal + gst;
  const renewMonthly = baseMonthly + Math.round(baseMonthly * GST_RATE);

  const intervalLabel = selection.interval === 'yearly' ? 'Yearly' : 'Monthly';
  const lineLabel =
    selection.interval === 'yearly'
      ? `${plan.name} yearly`
      : `${plan.name} monthly`;

  return {
    plan,
    planLabel: `${plan.name} Plan`,
    intervalLabel,
    lineLabel,
    baseMonthly,
    promoApplied,
    promoCode: promoApplied ? PROMO_CLEAR20.code : null,
    promoDiscount,
    subtotal,
    gst,
    totalToday,
    renewMonthly,
    unlockHighlights: getUnlockHighlights(plan),
    showNewBadge: plan.id === 'pro',
  };
}

export function formatRenewalDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const UPI_APP_LABEL = Object.fromEntries(UPI_APPS.map((a) => [a.id, a.label]));

export function getUpiAppLabel(appId) {
  return UPI_APP_LABEL[appId] ?? 'UPI app';
}

export function createPaymentReference(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `#CF${y}${m}${day}`;
}

export function formatAttemptedAt(date = new Date()) {
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} · ${timePart}`;
}

export function formatNextBillingDate(monthsAhead = 1) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Demo: card ending in 0002 triggers decline. */
export function resolvePaymentOutcome({ paymentMethod, cardNumber }) {
  const normalized = cardNumber?.replace(/\s/g, '') ?? '';
  if (paymentMethod === 'card' && normalized.endsWith('0002')) {
    return 'failed';
  }
  if (paymentMethod === 'upi') return 'awaiting';
  return 'success';
}

export function getSuccessTitle(planId) {
  const plan = getPaidPlan(planId);
  return plan ? `You're on ${plan.name}` : "You're all set";
}

export { formatInr };

export function getPayButtonLabel(summary, paymentMethod, netbankingBank) {
  const amount = formatInr(summary.renewMonthly);
  if (paymentMethod === 'netbanking' && netbankingBank) {
    return `Continue to ${netbankingBank.name} →`;
  }
  if (paymentMethod === 'upi') {
    return `Pay ${amount} →`;
  }
  return `Pay ${amount} / month →`;
}

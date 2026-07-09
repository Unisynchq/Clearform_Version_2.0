import { getPlanDisplayPrice, PAID_PLANS } from '@/features/profile/utils/profilePlanCatalog';
import { formatInr } from '@/features/profile/utils/profileBillingCheckout';

/** Backend plan id for Razorpay Payment Link pilot ($34.99 / 90 days). */
export const PILOT_35_PLAN_ID = 'pilot_35';

/** Free tier when API billing is configured (matches backend FREE_PLAN). */
export const API_FREE_PLAN = {
  id: 'free',
  name: 'Free',
  priceLabel: '$0',
  priceSubtext: 'Upgrade to pilot for more',
  limitsLabel: 'Unlimited forms · 50 responses',
  formsLimit: null,
  responsesLimit: 50,
  teamLimit: 1,
  headerSubtext: 'Free workspace — upgrade to Clearform Pilot for AI + 300 responses',
};

/** @deprecated Offline demo only — use API_FREE_PLAN when VITE_API_BASE_URL is set */
export const FREE_PLAN = API_FREE_PLAN;

const PLAN_STRIP = {
  pilot_35: {
    stripTitle: 'Clearform Pilot',
    stripSubtitle: '300 responses · Unlimited forms · 3 workspaces',
    invoiceTitle: 'Clearform Pilot — One-time',
    taxPlanName: 'Clearform Pilot',
    taxPlanSubtitle: '300 responses · Unlimited forms · 3 workspaces · 90 days',
    limitsLabel: 'Unlimited forms · 300 responses · 3 workspaces',
    formsLimit: null,
    responsesLimit: 300,
    workspacesLimit: 3,
    teamLimit: 1,
    headerSubtext: 'Your Clearform Pilot access is active',
    defaultUsage: { responsesThisMonth: 0, formsUsed: 0, workspacesUsed: 0 },
    bundledLineItems: [
      {
        description: 'AI Response Quality Scoring — Included',
        subtitle: 'Score every submission automatically · Bundled with Pilot',
        qty: '1',
        unitPrice: 0,
        amount: 0,
      },
    ],
  },
  // Starter/Pro recurring plans are not shipped — the backend rejects them
  // (501 from createSubscription). Keep only plans the backend can honour.
};

function formatExpiryDate(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getActivePlanDisplay(planId, interval = 'monthly', { expiresAt, isTrial = false } = {}) {
  if (planId === PILOT_35_PLAN_ID) {
    const meta = PLAN_STRIP.pilot_35;
    const expiryLabel = expiresAt ? formatExpiryDate(expiresAt) : null;
    const fallbackLabel = isTrial ? '7-day pilot trial' : '90-day pilot access';
    const renewLabel = expiryLabel
      ? isTrial
        ? `Trial ends ${expiryLabel}`
        : `Expires ${expiryLabel}`
      : fallbackLabel;
    return {
      id: PILOT_35_PLAN_ID,
      name: 'Clearform Pilot',
      interval: 'pilot',
      monthlyPrice: 34.99,
      priceLabel: '$34.99',
      priceSubtext: 'one-time',
      renewLabel,
      isOneTime: true,
      ...meta,
    };
  }

  const catalog = PAID_PLANS.find((p) => p.id === planId);
  const meta = PLAN_STRIP[planId];
  if (!catalog || !meta) return null;

  const monthly = getPlanDisplayPrice(catalog, interval);
  const renewInclGst = monthly + Math.round(monthly * 0.18);

  return {
    id: planId,
    name: catalog.name,
    interval,
    monthlyPrice: monthly,
    priceLabel: formatInr(monthly),
    priceSubtext: '/mo',
    renewLabel: `Next billing ${formatNextBillingShort()} · ${formatInr(renewInclGst)} incl. GST`,
    ...meta,
  };
}

function formatNextBillingShort(monthsAhead = 1) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

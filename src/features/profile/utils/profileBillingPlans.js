import { getPlanDisplayPrice, PAID_PLANS } from '@/features/profile/utils/profilePlanCatalog';
import { formatInr } from '@/features/profile/utils/profileBillingCheckout';

/** Legacy DB / client id — display as Pro. */
export const PILOT_35_PLAN_ID = 'pilot_35';
export const PRO_PLAN_ID = 'pro';
export const STARTER_PLAN_ID = 'starter';
export const PUBLISH_PASS_PLAN_ID = 'publish_pass';
export const UNPAID_PLAN_ID = 'unpaid';

/** Unpaid / locked — no free publish, responses, or AI benefits. */
export const API_UNPAID_PLAN = {
  id: UNPAID_PLAN_ID,
  name: 'No plan',
  priceLabel: '—',
  priceSubtext: 'Unlock with ₹99 or Starter',
  limitsLabel: 'Publish locked · Buy a Publish Pass or Starter',
  formsLimit: null,
  responsesLimit: 0,
  workspacesLimit: 1,
  teamLimit: 1,
  headerSubtext: 'No active plan — purchase a Publish Pass or Starter to unlock',
  isOneTime: false,
  renewLabel: null,
};

/** @deprecated Alias — free tier removed. */
export const API_FREE_PLAN = API_UNPAID_PLAN;
/** @deprecated Offline demo only — use API_UNPAID_PLAN when API billing is on. */
export const FREE_PLAN = API_UNPAID_PLAN;

const PLAN_STRIP = {
  unpaid: {
    stripTitle: 'No plan',
    stripSubtitle: 'Publish locked until you buy',
    invoiceTitle: 'Clearform',
    taxPlanName: 'Clearform',
    taxPlanSubtitle: 'No active plan',
    limitsLabel: 'Publish locked · Buy a Publish Pass or Starter',
    formsLimit: null,
    responsesLimit: 0,
    workspacesLimit: 1,
    teamLimit: 1,
    headerSubtext: 'No active plan — purchase a Publish Pass or Starter to unlock',
    bundledLineItems: [],
  },
  publish_pass: {
    stripTitle: 'Publish Pass',
    stripSubtitle: 'One form live · 100 responses · link + QR',
    invoiceTitle: 'Clearform Publish Pass',
    taxPlanName: 'Publish Pass',
    taxPlanSubtitle: 'One publish license · 100 responses per form',
    limitsLabel: '1 publish license · 100 responses / form · link + QR',
    formsLimit: null,
    responsesLimit: null,
    responsesPerFormLimit: 100,
    workspacesLimit: 1,
    teamLimit: 1,
    headerSubtext: 'Publish Pass — use a license when you publish',
    priceLabel: '₹99',
    priceSubtext: 'one-time per form',
    isOneTime: true,
    bundledLineItems: [],
  },
  starter: {
    stripTitle: 'Clearform Starter',
    stripSubtitle: 'Unlimited publish · 200 responses / mo · embed & AI',
    invoiceTitle: 'Clearform Starter — Monthly',
    taxPlanName: 'Clearform Starter',
    taxPlanSubtitle: 'Unlimited publish · 200 responses / month · 2 workspaces',
    limitsLabel: 'Unlimited publish · 200 responses / mo · 2 workspaces',
    formsLimit: null,
    responsesLimit: 200,
    workspacesLimit: 2,
    teamLimit: 1,
    headerSubtext: 'Your Clearform Starter plan is active',
    priceLabel: '₹499',
    priceSubtext: '/mo',
    isOneTime: false,
    bundledLineItems: [],
  },
  /** Pro — renamed from Pilot ($34.99 / 90 days). */
  pro: {
    stripTitle: 'Clearform Pro',
    stripSubtitle: '300 responses · Unlimited forms · 3 workspaces',
    invoiceTitle: 'Clearform Pro — One-time',
    taxPlanName: 'Clearform Pro',
    taxPlanSubtitle: '300 responses · Unlimited forms · 3 workspaces · 90 days',
    limitsLabel: 'Unlimited forms · 300 responses · 3 workspaces',
    formsLimit: null,
    responsesLimit: 300,
    workspacesLimit: 3,
    teamLimit: 1,
    headerSubtext: 'Your Clearform Pro access is active',
    priceLabel: '$34.99',
    priceSubtext: 'one-time',
    isOneTime: true,
    bundledLineItems: [
      {
        description: 'AI Response Quality Scoring — Included',
        subtitle: 'Score every submission automatically · Bundled with Pro',
        qty: '1',
        unitPrice: 0,
        amount: 0,
      },
    ],
  },
};

function formatExpiryDate(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeClientPlanId(planId) {
  if (!planId || planId === 'free') return UNPAID_PLAN_ID;
  if (planId === PILOT_35_PLAN_ID) return PRO_PLAN_ID;
  return planId;
}

/**
 * Display model for the billing panel current-plan card.
 * @param {string} planId
 * @param {string} [interval]
 * @param {{ expiresAt?: string|Date, isTrial?: boolean, status?: string }} [opts]
 */
export function getActivePlanDisplay(planId, interval = 'monthly', { expiresAt, isTrial = false, status } = {}) {
  const id = normalizeClientPlanId(planId);

  if (id === UNPAID_PLAN_ID) {
    const meta = PLAN_STRIP.unpaid;
    const expired = status === 'EXPIRED';
    return {
      id: UNPAID_PLAN_ID,
      name: expired ? 'Plan ended' : 'No plan',
      interval: 'none',
      monthlyPrice: 0,
      priceLabel: '—',
      priceSubtext: expired ? 'Renew Starter or buy a Publish Pass' : 'Unlock with ₹99 or Starter',
      renewLabel: null,
      isOneTime: false,
      ...meta,
      headerSubtext: expired
        ? 'Your plan has ended — forms stay live; publish & new responses are locked'
        : meta.headerSubtext,
      limitsLabel: expired
        ? 'Locked until you renew Starter or buy a Publish Pass'
        : meta.limitsLabel,
    };
  }

  if (id === PRO_PLAN_ID) {
    const meta = PLAN_STRIP.pro;
    const expiryLabel = expiresAt ? formatExpiryDate(expiresAt) : null;
    const fallbackLabel = isTrial ? 'Pro trial' : '90-day Pro access';
    const renewLabel = expiryLabel
      ? isTrial
        ? `Trial ends ${expiryLabel}`
        : `Expires ${expiryLabel}`
      : fallbackLabel;
    return {
      id: PRO_PLAN_ID,
      name: 'Clearform Pro',
      interval: 'pro',
      monthlyPrice: 34.99,
      priceLabel: meta.priceLabel,
      priceSubtext: meta.priceSubtext,
      renewLabel,
      isOneTime: true,
      ...meta,
    };
  }

  if (id === PUBLISH_PASS_PLAN_ID) {
    const meta = PLAN_STRIP.publish_pass;
    return {
      id: PUBLISH_PASS_PLAN_ID,
      name: 'Publish Pass',
      interval: 'pass',
      monthlyPrice: 99,
      priceLabel: meta.priceLabel,
      priceSubtext: meta.priceSubtext,
      renewLabel: 'One-time per form',
      isOneTime: true,
      ...meta,
    };
  }

  if (id === STARTER_PLAN_ID) {
    const meta = PLAN_STRIP.starter;
    const catalog = PAID_PLANS.find((p) => p.id === 'starter');
    const monthly = catalog ? getPlanDisplayPrice(catalog, interval) : 499;
    const renewInclGst = monthly + Math.round(monthly * 0.18);
    return {
      id: STARTER_PLAN_ID,
      name: 'Clearform Starter',
      interval,
      monthlyPrice: monthly,
      priceLabel: formatInr(monthly),
      priceSubtext: '/mo',
      renewLabel: `Next billing ${formatNextBillingShort()} · ${formatInr(renewInclGst)} incl. GST`,
      isOneTime: false,
      ...meta,
    };
  }

  const catalog = PAID_PLANS.find((p) => p.id === id);
  const meta = PLAN_STRIP[id];
  if (!catalog || !meta) return null;

  const monthly = getPlanDisplayPrice(catalog, interval);
  const renewInclGst = monthly + Math.round(monthly * 0.18);

  return {
    id,
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

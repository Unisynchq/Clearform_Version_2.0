import { getPlanDisplayPrice, PAID_PLANS } from '@/features/profile/utils/profilePlanCatalog';
import { formatInr } from '@/features/profile/utils/profileBillingCheckout';

export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  priceLabel: '₹0',
  priceSubtext: 'forever free',
  limitsLabel: '3 forms · 100 responses / month',
  formsLimit: 3,
  responsesLimit: 100,
  teamLimit: 1,
  headerSubtext: "You're on the free plan",
};

const PLAN_STRIP = {
  starter: {
    stripTitle: 'Starter plan',
    stripSubtitle: '10 active forms · 1,000 responses / month',
    invoiceTitle: 'Clearform Starter — Monthly',
    taxPlanName: 'Clearform Starter',
    taxPlanSubtitle: '10 active forms · 1,000 responses/mo · AI quality scoring',
    limitsLabel: '10 active forms · 1,000 responses / month',
    formsLimit: 10,
    responsesLimit: 1000,
    teamLimit: 1,
    headerSubtext: 'Your Starter plan is active',
    defaultUsage: { formsUsed: 4, responsesThisMonth: 240 },
    bundledLineItems: [
      {
        description: 'AI Response Quality Scoring — Included',
        subtitle: 'Score every submission automatically · Bundled with Starter',
        qty: '1',
        unitPrice: 0,
        amount: 0,
      },
      {
        description: 'Remove Clearform Branding — Included',
        subtitle: 'White-label your published forms · Bundled with Starter',
        qty: '1',
        unitPrice: 0,
        amount: 0,
      },
    ],
  },
  pro: {
    stripTitle: 'Pro plan',
    stripSubtitle: 'Unlimited forms · 10,000 responses/mo · 5 members',
    invoiceTitle: 'Clearform Pro — Monthly',
    taxPlanName: 'Clearform Pro',
    taxPlanSubtitle:
      'Unlimited forms · 10,000 responses/mo · 5 members · AI dynamic Qs',
    limitsLabel: 'Unlimited forms · 10,000 responses / month · 5 members',
    formsLimit: null,
    responsesLimit: 10000,
    teamLimit: 5,
    headerSubtext: 'Your Pro plan is active',
    defaultUsage: { responsesThisMonth: 6240 },
    bundledLineItems: [
      {
        description: 'AI Dynamic Questions — Included',
        subtitle: 'Adaptive form logic powered by AI · Bundled with Pro',
        qty: '1',
        unitPrice: 0,
        amount: 0,
      },
      {
        description: 'Team Collaboration (up to 5 members)',
        subtitle: 'Role-based access · Workspace sharing · Bundled with Pro',
        qty: '5 seats',
        unitPrice: 0,
        amount: 0,
      },
      {
        description: 'Priority Support',
        subtitle: 'Dedicated email & chat support · Bundled with Pro',
        qty: '1',
        unitPrice: 0,
        amount: 0,
      },
    ],
  },
};

export function getActivePlanDisplay(planId, interval = 'monthly') {
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

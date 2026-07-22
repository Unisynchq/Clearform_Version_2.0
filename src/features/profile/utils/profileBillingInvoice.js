import {
  calculateCheckoutSummary,
  formatInr,
  formatNextBillingDate,
  getPaidPlan,
} from '@/features/profile/utils/profileBillingCheckout';
import { getActivePlanDisplay } from '@/features/profile/utils/profileBillingPlans';
import { getInvoiceSellerDetails } from '@/features/profile/utils/invoiceSellerDetails';

function formatInrDecimal(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateInvoiceNumber(date = new Date()) {
  const y = date.getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `#CF-${y}-${seq}`;
}

/** Split GST-inclusive total into excl. subtotal + CGST + SGST (9% each). */
export function splitGstInclusive(totalInclGst) {
  const subtotalExcl = Math.round((totalInclGst / 1.18) * 100) / 100;
  const cgst = Math.round(subtotalExcl * 0.09 * 100) / 100;
  const sgst = Math.round(subtotalExcl * 0.09 * 100) / 100;
  return { subtotalExcl, cgst, sgst, total: subtotalExcl + cgst + sgst };
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPeriodRange(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  const a = start.toLocaleDateString('en-IN', opts);
  const b = end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' });
  return `${a} – ${b}`;
}

/**
 * @param {{ planId: string, interval: string, promoApplied?: boolean, paymentContext?: object, invoiceNumber?: string, activatedAt?: number }} subscription
 * @param {{ firstName?: string, lastName?: string, email?: string }} customer
 */
export function buildTaxInvoice(subscription, customer = {}) {
  const promoApplied =
    subscription.promoApplied ??
    (subscription.paymentContext?.paymentMethod === 'card' &&
      subscription.planId === 'pro');
  const summary = calculateCheckoutSummary({
    planId: subscription.planId,
    interval: subscription.interval,
    promoApplied,
  });
  const display = getActivePlanDisplay(subscription.planId, subscription.interval);
  const catalog = getPaidPlan(subscription.planId);
  if (!summary || !display || !catalog) return null;

  const activatedAt = subscription.activatedAt ?? Date.now();
  const issueDate = new Date(activatedAt);
  const periodEnd = new Date(issueDate);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const gst = splitGstInclusive(summary.totalToday);
  const intervalLabel = subscription.interval === 'yearly' ? 'Yearly' : 'Monthly';
  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';

  const lineItems = [
    {
      description: `${catalog.name} — ${intervalLabel} Subscription`,
      subtitle: `Billing cycle: ${formatPeriodRange(issueDate, periodEnd)}`,
      qty: '1',
      unitPrice: gst.subtotalExcl,
      amount: gst.subtotalExcl,
    },
    ...display.bundledLineItems,
  ];

  const paymentMethod = subscription.paymentContext?.paymentMethod;
  const cardMask =
    paymentMethod === 'card'
      ? '•••• •••• •••• 4821'
      : paymentMethod === 'upi'
        ? 'UPI · punith@okaxis'
        : 'Netbanking';

  return {
    invoiceNumber: subscription.invoiceNumber ?? generateInvoiceNumber(issueDate),
    status: 'paid',
    issueDate: formatShortDate(issueDate),
    periodLabel: formatPeriodRange(issueDate, periodEnd),
    periodEndLabel: formatPeriodRange(issueDate, periodEnd),
    chargedOn: formatShortDate(issueDate),
    planId: subscription.planId,
    planName: catalog.name,
    intervalLabel,
    displayTitle: display.invoiceTitle,
    stripTitle: display.stripTitle,
    stripSubtitle: display.stripSubtitle,
    taxPlanName: display.taxPlanName,
    taxPlanSubtitle: display.taxPlanSubtitle,
    monthlyPrice: summary.baseMonthly,
    monthlyPriceLabel: formatInr(summary.baseMonthly),
    promoCode: summary.promoCode,
    promoDiscount: summary.promoDiscount,
    subtotalExcl: gst.subtotalExcl,
    subtotalExclLabel: formatInrDecimal(gst.subtotalExcl),
    cgst: gst.cgst,
    cgstLabel: formatInrDecimal(gst.cgst),
    sgst: gst.sgst,
    sgstLabel: formatInrDecimal(gst.sgst),
    totalPaid: summary.totalToday,
    totalPaidLabel: formatInr(summary.totalToday),
    totalPaidDisplay: formatInr(Math.round(summary.totalToday)),
    nextBillingDate: formatNextBillingDate(),
    nextBillingInclGst: formatInr(summary.renewMonthly),
    gstApplies: true,
    currency: 'INR',
    isOneTime: false,
    pilotExpiresLabel: null,
    seller: getInvoiceSellerDetails(),
    lineItems,
    paymentMethodLabel: cardMask,
    paymentExpiry: paymentMethod === 'card' ? 'Visa · Expires 09/28' : 'Razorpay',
    customer: {
      company: 'Acme Design Studio',
      name: customerName,
      email: customer.email ?? 'punithraj2202@gmail.com',
      address: 'Mumbai, Maharashtra – 400001',
      gstin: '27AAPFA0090N1ZN',
    },
  };
}

/**
 * Build invoice display from API billing receipt (Razorpay payment id).
 * @param {{ paymentId: string, purchasedAt?: string, amount?: number, currency?: string }} receipt
 * @param {{ firstName?: string, lastName?: string, email?: string }} customer
 * @param {{ expiresAt?: string, periodEnd?: string }} billingStatus
 */
export function buildInvoiceFromBillingReceipt(receipt, customer = {}, billingStatus = {}) {
  if (!receipt?.paymentId) return null;

  const display = getActivePlanDisplay('pilot_35', 'pilot', {
    expiresAt: billingStatus.expiresAt ?? billingStatus.periodEnd,
  });
  if (!display) return null;

  const purchasedAt = receipt.purchasedAt ? new Date(receipt.purchasedAt) : new Date();
  const expiresAt = billingStatus.expiresAt ?? billingStatus.periodEnd;
  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
  const amountPaid = receipt.amount ?? 34.99;
  const currency = (receipt.currency ?? 'USD').toUpperCase();
  const seller = getInvoiceSellerDetails();
  // GST applies only to INR charges from a GST-registered seller.
  const gstApplies = currency === 'INR' && Boolean(seller.gstin);
  const amountLabel =
    currency === 'INR' ? formatInr(amountPaid) : `$${Number(amountPaid).toFixed(2)}`;

  const periodLabel =
    expiryDate && !Number.isNaN(expiryDate.getTime())
      ? `${formatShortDate(purchasedAt)} – ${formatShortDate(expiryDate)}`
      : formatShortDate(purchasedAt);

  const gst = gstApplies ? splitGstInclusive(amountPaid) : null;
  const formatAmount = (value) =>
    currency === 'INR' ? formatInrDecimal(value) : `$${Number(value).toFixed(2)}`;

  return {
    invoiceNumber: receipt.paymentId,
    status: 'paid',
    issueDate: formatShortDate(purchasedAt),
    periodLabel,
    periodEndLabel: periodLabel,
    chargedOn: formatShortDate(purchasedAt),
    planId: 'pilot_35',
    planName: display.name,
    intervalLabel: 'One-time',
    displayTitle: display.invoiceTitle,
    stripTitle: display.stripTitle,
    stripSubtitle: display.stripSubtitle,
    taxPlanName: display.taxPlanName,
    taxPlanSubtitle: display.taxPlanSubtitle,
    monthlyPrice: amountPaid,
    monthlyPriceLabel: amountLabel,
    promoCode: null,
    promoDiscount: 0,
    subtotalExcl: gst ? gst.subtotalExcl : amountPaid,
    subtotalExclLabel: gst ? formatAmount(gst.subtotalExcl) : amountLabel,
    cgst: gst?.cgst ?? 0,
    cgstLabel: gst ? formatAmount(gst.cgst) : '—',
    sgst: gst?.sgst ?? 0,
    sgstLabel: gst ? formatAmount(gst.sgst) : '—',
    gstApplies,
    currency,
    isOneTime: true,
    totalPaid: amountPaid,
    totalPaidLabel: amountLabel,
    totalPaidDisplay: amountLabel,
    nextBillingDate: expiryDate ? formatShortDate(expiryDate) : '—',
    nextBillingInclGst: '—',
    pilotExpiresLabel: expiryDate ? formatShortDate(expiryDate) : null,
    seller,
    lineItems: [
      {
        description: 'Clearform Pilot — One-time access',
        subtitle: display.taxPlanSubtitle,
        qty: '1',
        unitPrice: amountPaid,
        amount: amountPaid,
      },
      ...display.bundledLineItems,
    ],
    paymentMethodLabel: `Razorpay · ${receipt.paymentId}`,
    paymentExpiry: 'Razorpay',
    customer: {
      company: '',
      name: customerName,
      email: customer.email ?? '',
      address: '',
      gstin: '',
    },
  };
}

/** @param {{ planId: string, interval: string, paymentContext?: object }} checkout */
export function createSubscriptionFromCheckout(checkout) {
  const promoApplied =
    checkout.paymentContext?.paymentMethod === 'card' && checkout.planId === 'pro';
  const display = getActivePlanDisplay(checkout.planId, checkout.interval);

  return {
    planId: checkout.planId,
    interval: checkout.interval,
    activatedAt: Date.now(),
    promoApplied,
    paymentContext: checkout.paymentContext ?? {},
    invoiceNumber: generateInvoiceNumber(),
    usage: display?.defaultUsage ?? {},
  };
}

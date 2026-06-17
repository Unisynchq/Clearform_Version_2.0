import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

/**
 * Billing API — pilot purchase claim, status, and hosted checkout.
 */
export async function getStatus() {
  if (!isApiConfigured()) return null;
  return apiClient(API_ENDPOINTS.billing.status());
}

export async function claimPurchase({ paymentId, orderId } = {}) {
  if (!isApiConfigured()) return null;
  const body = {};
  if (paymentId?.trim()) body.paymentId = paymentId.trim();
  if (orderId?.trim()) body.orderId = orderId.trim();
  if (!body.paymentId && !body.orderId) {
    throw new Error('Payment ID or order ID is required');
  }
  return apiClient(API_ENDPOINTS.billing.claimPurchase(), {
    method: 'POST',
    body,
  });
}

export async function createPilotCheckoutSession() {
  if (!isApiConfigured()) {
    throw new Error('API is not configured');
  }
  return apiClient(API_ENDPOINTS.billing.pilotCheckoutSession(), {
    method: 'POST',
  });
}

/** Legacy Payment Link checkout — prefer pilot Orders API from Profile → Billing. */
export async function createCheckout(body = {}) {
  if (!isApiConfigured()) return null;
  return apiClient(API_ENDPOINTS.billing.createCheckout(), {
    method: 'POST',
    body,
  });
}

/** Resolve checkout URL from API response and redirect (legacy Payment Link). */
export async function redirectToCheckout(body = {}) {
  const data = await createCheckout(body);
  const url =
    data?.checkoutUrl ??
    data?.url ??
    data?.shortUrl ??
    data?.paymentLinkUrl ??
    data?.payment_link?.short_url;
  if (!url) {
    throw new Error('Checkout URL was not returned by the server');
  }
  window.location.href = url;
  return data;
}

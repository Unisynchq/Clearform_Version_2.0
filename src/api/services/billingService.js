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

export async function claimPurchase({ paymentId }) {
  if (!isApiConfigured()) return null;
  if (!paymentId?.trim()) {
    throw new Error('Payment ID is required');
  }
  return apiClient(API_ENDPOINTS.billing.claimPurchase(), {
    method: 'POST',
    body: { paymentId: paymentId.trim() },
  });
}

export async function createCheckout(body = {}) {
  if (!isApiConfigured()) return null;
  return apiClient(API_ENDPOINTS.billing.createCheckout(), {
    method: 'POST',
    body,
  });
}

/** Resolve checkout URL from API response and redirect. */
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

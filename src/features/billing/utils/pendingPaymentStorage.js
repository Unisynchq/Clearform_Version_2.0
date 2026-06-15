const PENDING_PAYMENT_ID_KEY = 'clearform:pending-payment-id';
const PENDING_PAYMENT_LINK_ID_KEY = 'clearform:pending-payment-link-id';

/**
 * Persist Razorpay redirect query params for post-signup claim.
 */
export function capturePendingPaymentFromUrl() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get('payment_id');
  if (!paymentId?.trim()) return false;

  sessionStorage.setItem(PENDING_PAYMENT_ID_KEY, paymentId.trim());

  const paymentLinkId = params.get('payment_link_id');
  if (paymentLinkId?.trim()) {
    sessionStorage.setItem(PENDING_PAYMENT_LINK_ID_KEY, paymentLinkId.trim());
  }

  params.delete('payment_id');
  params.delete('payment_link_id');
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);
  return true;
}

export function getPendingPaymentId() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_PAYMENT_ID_KEY);
}

export function clearPendingPaymentId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_PAYMENT_ID_KEY);
  sessionStorage.removeItem(PENDING_PAYMENT_LINK_ID_KEY);
}

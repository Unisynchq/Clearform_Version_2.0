const PENDING_PAYMENT_ID_KEY = 'clearform:pending-payment-id';
const PENDING_ORDER_ID_KEY = 'clearform:pending-order-id';
const PENDING_PAYMENT_LINK_ID_KEY = 'clearform:pending-payment-link-id';

function readPaymentIdFromParams(params) {
  return (
    params.get('razorpay_payment_id') ??
    params.get('payment_id') ??
    null
  );
}

function readOrderIdFromParams(params) {
  return params.get('razorpay_order_id') ?? params.get('order_id') ?? null;
}

/**
 * Persist Razorpay redirect query params for post-signup claim.
 * Supports Payment Link (`payment_id`) and Orders checkout (`razorpay_payment_id`).
 */
export function capturePendingPaymentFromUrl() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const paymentId = readPaymentIdFromParams(params)?.trim();
  const orderId = readOrderIdFromParams(params)?.trim();

  if (!paymentId && !orderId) return false;

  if (paymentId) {
    sessionStorage.setItem(PENDING_PAYMENT_ID_KEY, paymentId);
  }
  if (orderId) {
    sessionStorage.setItem(PENDING_ORDER_ID_KEY, orderId);
  }

  const paymentLinkId = params.get('payment_link_id');
  if (paymentLinkId?.trim()) {
    sessionStorage.setItem(PENDING_PAYMENT_LINK_ID_KEY, paymentLinkId.trim());
  }

  [
    'payment_id',
    'payment_link_id',
    'razorpay_payment_id',
    'razorpay_order_id',
    'razorpay_signature',
    'order_id',
  ].forEach((key) => params.delete(key));

  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);
  return true;
}

export function getPendingPaymentId() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_PAYMENT_ID_KEY);
}

export function getPendingOrderId() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_ORDER_ID_KEY);
}

export function clearPendingPaymentId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_PAYMENT_ID_KEY);
  sessionStorage.removeItem(PENDING_ORDER_ID_KEY);
  sessionStorage.removeItem(PENDING_PAYMENT_LINK_ID_KEY);
}

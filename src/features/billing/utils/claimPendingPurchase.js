import { claimPurchase } from '@/api/services/billingService';
import { isApiConfigured } from '@/config/env';
import {
  clearPendingPaymentId,
  getPendingOrderId,
  getPendingPaymentId,
} from '@/features/billing/utils/pendingPaymentStorage';

const CLAIMED_KEY = 'clearform:billing-claim-done';

function markClaimed(paymentId, orderId) {
  if (typeof sessionStorage === 'undefined') return;
  const key = paymentId ?? orderId;
  if (key) sessionStorage.setItem(CLAIMED_KEY, key);
}

function wasClaimed(paymentId, orderId) {
  if (typeof sessionStorage === 'undefined') return false;
  const key = paymentId ?? orderId;
  return key && sessionStorage.getItem(CLAIMED_KEY) === key;
}

/**
 * Claim a pending Razorpay payment after redirect or signup.
 * Idempotent per payment/order id in sessionStorage.
 */
export async function claimPendingPurchaseIfPresent({ showToast } = {}) {
  if (!isApiConfigured()) return { claimed: false };

  const paymentId = getPendingPaymentId();
  const orderId = getPendingOrderId();
  if (!paymentId && !orderId) return { claimed: false };
  if (wasClaimed(paymentId, orderId)) return { claimed: true, alreadyClaimed: true };

  try {
    await claimPurchase({ paymentId, orderId });
    markClaimed(paymentId, orderId);
    clearPendingPaymentId();
    showToast?.({
      type: 'success',
      message: 'Your Clearform Pilot is linked to this account.',
      duration: 4000,
    });
    return { claimed: true };
  } catch (err) {
    const message =
      err?.message ??
      'We could not link your payment. Try Profile → Billing or contact support@clearform.in.';
    showToast?.({
      type: 'error',
      message,
      duration: 8000,
    });
    return { claimed: false, error: message };
  }
}

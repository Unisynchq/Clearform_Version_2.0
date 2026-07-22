import { claimPendingPurchaseIfPresent } from '@/features/billing/utils/claimPendingPurchase';
import {
  capturePendingPaymentFromUrl,
  getPendingOrderId,
  getPendingPaymentId,
} from '@/features/billing/utils/pendingPaymentStorage';

export { claimPendingPurchaseIfPresent };

/**
 * Capture Razorpay redirect params from the current URL, then claim if present.
 */
export async function captureAndClaimPendingPurchase(options = {}) {
  capturePendingPaymentFromUrl();
  const paymentId = getPendingPaymentId();
  const orderId = getPendingOrderId();
  if (!paymentId && !orderId) return { claimed: false };
  return claimPendingPurchaseIfPresent(options);
}

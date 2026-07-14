import { claimPurchase, getStatus } from '@/api/services/billingService';
import { isApiConfigured } from '@/config/env';
import { PILOT_35_PLAN_ID } from '@/features/profile/utils/profileBillingPlans';
import {
  clearPendingPaymentId,
  getPendingOrderId,
  getPendingPaymentId,
} from '@/features/billing/utils/pendingPaymentStorage';
import { trackPilotActivated } from '@/analytics/track';

const CLAIMED_KEY = 'clearform:billing-claim-done';
const RETRY_DELAY_MS = 2000;

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

async function statusShowsPilot() {
  try {
    const status = await getStatus();
    return (
      status?.planId === PILOT_35_PLAN_ID && status?.status !== 'EXPIRED'
    );
  } catch {
    return false;
  }
}

async function attemptClaim({ paymentId, orderId, showToast }) {
  await claimPurchase({ paymentId, orderId });
  if (await statusShowsPilot()) {
    return true;
  }
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  await claimPurchase({ paymentId, orderId });
  return statusShowsPilot();
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
  if (wasClaimed(paymentId, orderId)) {
    if (await statusShowsPilot()) {
      return { claimed: true, alreadyClaimed: true };
    }
    // Payment captured but tier not active — retry claim.
  }

  try {
    const activated = await attemptClaim({ paymentId, orderId, showToast });
    if (activated) {
      markClaimed(paymentId, orderId);
      clearPendingPaymentId();
      trackPilotActivated({ source: 'razorpay' });
      showToast?.({
        type: 'success',
        message: 'Your Clearform Pilot is linked to this account.',
        duration: 4000,
      });
      return { claimed: true };
    }

    showToast?.({
      type: 'warning',
      message:
        'Payment received — open Profile → Billing to finish activation.',
      duration: 8000,
    });
    return { claimed: false, pendingActivation: true };
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

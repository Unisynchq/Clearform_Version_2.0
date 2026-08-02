import { createPublishPassCheckoutSession } from '@/api/services/billingService';
import { loadRazorpayCheckoutScript } from '@/features/billing/utils/loadRazorpayCheckout';

/**
 * Open Razorpay Checkout for a Publish Pass Order (₹99 — price from Razorpay Item).
 * @param {{ formId?: string }} [opts]
 */
export async function openPublishPassRazorpayCheckout(opts = {}) {
  const session = await createPublishPassCheckoutSession({
    formId: opts.formId,
  });
  const Razorpay = await loadRazorpayCheckoutScript();

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: session.productName ?? 'Clearform',
      description: session.description ?? 'Publish Pass',
      order_id: session.orderId,
      callback_url: session.callbackUrl,
      redirect: true,
      theme: { color: '#18181b' },
    });

    checkout.on('payment.failed', (response) => {
      const reason =
        response?.error?.description ??
        response?.error?.reason ??
        'Payment could not be completed.';
      reject(new Error(reason));
    });

    checkout.open();
    resolve(session);
  });
}

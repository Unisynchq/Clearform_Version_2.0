import { createStarterSubscription } from '@/api/services/billingService';
import { loadRazorpayCheckoutScript } from '@/features/billing/utils/loadRazorpayCheckout';

/**
 * Open Razorpay Checkout for Starter subscription (₹499 INR or $5 USD).
 * @param {{ currency?: 'INR' | 'USD' }} [opts]
 */
export async function openStarterRazorpayCheckout(opts = {}) {
  const currency = opts.currency === 'USD' ? 'USD' : 'INR';
  const session = await createStarterSubscription({ currency });
  const Razorpay = await loadRazorpayCheckoutScript();

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key: session.keyId,
      name: 'Clearform',
      description:
        currency === 'USD'
          ? 'Clearform Starter — $5/mo'
          : 'Clearform Starter — ₹499/mo',
      subscription_id: session.subscriptionId,
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

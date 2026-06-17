import { createPilotCheckoutSession } from '@/api/services/billingService';
import { loadRazorpayCheckoutScript } from '@/features/billing/utils/loadRazorpayCheckout';

/**
 * Open Razorpay Checkout for the pilot Orders session (authenticated user).
 */
export async function openPilotRazorpayCheckout() {
  const session = await createPilotCheckoutSession();
  const Razorpay = await loadRazorpayCheckoutScript();

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: session.productName ?? 'Clearform',
      description: session.description ?? 'Clearform Pilot',
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

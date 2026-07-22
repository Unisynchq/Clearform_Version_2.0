import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPilotCheckoutSession } from '@/api/services/billingService';
import { loadRazorpayCheckoutScript } from '@/features/billing/utils/loadRazorpayCheckout';

const PilotCheckoutPage = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const session = await createPilotCheckoutSession();
        if (cancelled) return;

        const Razorpay = await loadRazorpayCheckoutScript();
        if (cancelled) return;

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
          setError(reason);
          setLoading(false);
        });

        setLoading(false);
        checkout.open();
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.message ??
            'Unable to start checkout. Try again or contact support@clearform.in.',
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#e4e4e7] p-8 shadow-sm text-center">
        <h1 className="text-[22px] font-semibold text-[#18181b] mb-2">
          Clearform Pilot
        </h1>
        <p className="text-[14px] text-[#71717a] mb-6">
          $34.99 · 90 days · 300 responses
        </p>

        {loading && !error ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#e4e4e7] border-t-[#18181b] animate-spin" />
            <p className="text-[14px] text-[#71717a]">Opening secure checkout…</p>
          </div>
        ) : null}

        {error ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-[#b91c1c]">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-lg bg-[#18181b] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[#27272a]"
            >
              Try again
            </button>
          </div>
        ) : null}

        <p className="mt-8 text-[12px] text-[#a1a1aa]">
          Already paid?{' '}
          <Link to="/" className="text-[#18181b] underline underline-offset-2">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PilotCheckoutPage;

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { openPublishPassRazorpayCheckout } from '@/features/billing/utils/openPublishPassRazorpayCheckout';
import { openStarterRazorpayCheckout } from '@/features/billing/utils/openStarterRazorpayCheckout';
import { useToast } from '@/hooks/useToast';

/**
 * Billing: Publish Passes count + Buy ₹99 / Starter ₹499 CTAs (CLE-50).
 */
export default function PublishPassesWidget({
  available = 0,
  canPublishUnlimited = false,
  preferredCurrency = 'INR',
  onCheckoutStarted,
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const run = useCallback(
    async (key, fn) => {
      setLoading(key);
      onCheckoutStarted?.(true);
      try {
        await fn();
      } catch (err) {
        showToast({
          type: 'error',
          message: err?.message ?? 'Could not start checkout.',
          duration: 6000,
        });
      } finally {
        setLoading(null);
        onCheckoutStarted?.(false);
      }
    },
    [onCheckoutStarted, showToast],
  );

  const handleBuyPass = () =>
    run('pass', () => openPublishPassRazorpayCheckout());

  const handleBuyStarter = () =>
    run('starter', () =>
      openStarterRazorpayCheckout({ currency: preferredCurrency }),
    );

  const handleUseNow = () => {
    navigate('/dashboard/forms');
  };

  return (
    <section className="overflow-hidden rounded-[12px] border border-[#e5e3df] bg-white">
      <div className="border-b border-[#f0f0ee] px-5 py-4">
        <h2 className="text-[13px] font-semibold text-[#111110]">Publish Passes</h2>
        <p className="mt-px text-[12px] text-[#888580]">
          One pass publishes one form. Deleting a form never restores a pass.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {canPublishUnlimited ? (
            <p className="text-[22px] font-semibold leading-none text-[#111110]">
              Unlimited
            </p>
          ) : (
            <p className="text-[22px] font-semibold leading-none text-[#111110]">
              {Number(available) || 0}{' '}
              <span className="text-[13px] font-medium text-[#888580]">
                Available
              </span>
            </p>
          )}
          <p className="mt-1.5 text-[12px] text-[#888580]">
            {canPublishUnlimited
              ? 'Starter is active — publish without consuming passes.'
              : 'Use a pass when you publish, or buy more anytime.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!canPublishUnlimited && Number(available) > 0 ? (
            <button
              type="button"
              onClick={handleUseNow}
              className="rounded-[8px] border border-[#e5e3df] bg-white px-3 py-1.5 text-[12px] font-medium text-[#111110] transition-colors hover:bg-[#f7f7f5]"
            >
              Use Now
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleBuyPass}
            disabled={!!loading}
            className="rounded-[8px] bg-[#111110] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#2d2d2b] disabled:opacity-60"
          >
            {loading === 'pass' ? 'Opening…' : 'Buy ₹99'}
          </button>
          <button
            type="button"
            onClick={handleBuyStarter}
            disabled={!!loading}
            className="rounded-[8px] border border-[#111110] bg-white px-3 py-1.5 text-[12px] font-medium text-[#111110] transition-colors hover:bg-[#f7f7f5] disabled:opacity-60"
          >
            {loading === 'starter'
              ? 'Opening…'
              : preferredCurrency === 'USD'
                ? 'Starter — $5/mo'
                : 'Starter — ₹499/mo'}
          </button>
        </div>
      </div>
    </section>
  );
}

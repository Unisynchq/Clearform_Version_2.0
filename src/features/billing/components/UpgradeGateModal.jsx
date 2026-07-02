import { useCallback, useState } from 'react';
import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import { openPilotRazorpayCheckout } from '@/features/billing/utils/openPilotRazorpayCheckout';
import { useToast } from '@/hooks/useToast';

const PILOT_POINTS = [
  '300 responses · 90 days',
  'AI response quality (live nudges + scoring)',
  'AI logic generation & insights',
  'Premium AI models',
];

/**
 * Reusable paywall modal shown when a free-tier user hits a hard limit
 * (responses cap, AI rate limit, workspace limit). Opens Razorpay checkout.
 *
 * @param {{ open: boolean, onClose: () => void, title?: string, reason?: string }} props
 */
export default function UpgradeGateModal({ open, onClose, title, reason }) {
  const { showToast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgrade = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      await openPilotRazorpayCheckout();
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start checkout.',
        duration: 6000,
      });
    } finally {
      setCheckoutLoading(false);
    }
  }, [showToast]);

  return (
    <ProfileModal
      open={open}
      onClose={onClose}
      widthClass="w-[min(100%,460px)]"
      className="overflow-hidden rounded-[14px] border border-[#1a1a18] bg-[#1a1a18] p-0 shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-1 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-white/40">
          Clearform Pilot
        </p>
        <h3 className="pt-0.5 text-[18px] font-bold text-white">
          {title ?? 'Upgrade to keep going'}
        </h3>
        {reason ? (
          <p className="text-[13px] leading-[20.8px] text-white/60">{reason}</p>
        ) : null}
        <ul className="flex flex-col gap-1.5 py-3">
          {PILOT_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13px] text-white/70">
              <RiCheckLine size={16} className="mt-0.5 shrink-0 text-[#7dd3a0]" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            className="inline-flex items-center gap-1 rounded-[10px] bg-white px-5 py-2.5 text-[14px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6] disabled:opacity-60"
          >
            {checkoutLoading ? 'Opening checkout…' : 'Start Pilot — $34.99'}
            <RiArrowRightLine size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
          >
            Not now
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}

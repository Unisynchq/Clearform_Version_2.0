import { useCallback, useState } from 'react';
import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import { openPublishPassRazorpayCheckout } from '@/features/billing/utils/openPublishPassRazorpayCheckout';
import { openStarterRazorpayCheckout } from '@/features/billing/utils/openStarterRazorpayCheckout';
import { useToast } from '@/hooks/useToast';

const PASS_POINTS = [
  'Publish 1 form',
  'Up to 100 responses',
  'AI response quality (included)',
  'Shareable link + QR code',
  'Basic analytics + response table',
];

const STARTER_POINTS = [
  'Unlimited published forms',
  '200 responses / month',
  'Website embed + integrations',
  'AI Insights',
  '2 workspaces',
];

/**
 * Paywall when publish / entitlements block. Prefer Publish Pass ₹99 or Starter ₹499.
 *
 * @param {{ open: boolean, onClose: () => void, title?: string, reason?: string, quota?: { used: number, limit: number }, variant?: 'publish_pass' | 'starter', formId?: string }} props
 */
export default function UpgradeGateModal({
  open,
  onClose,
  title,
  reason,
  quota,
  variant = 'publish_pass',
  formId,
}) {
  const { showToast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const isStarter = variant === 'starter';
  const points = isStarter ? STARTER_POINTS : PASS_POINTS;

  const handleBuyPass = useCallback(async () => {
    setCheckoutLoading('pass');
    try {
      await openPublishPassRazorpayCheckout({ formId });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start checkout.',
        duration: 6000,
      });
    } finally {
      setCheckoutLoading(null);
    }
  }, [formId, showToast]);

  const handleBuyStarter = useCallback(async () => {
    setCheckoutLoading('starter');
    try {
      await openStarterRazorpayCheckout({ currency: 'INR' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start checkout.',
        duration: 6000,
      });
    } finally {
      setCheckoutLoading(null);
    }
  }, [showToast]);

  return (
    <ProfileModal
      open={open}
      onClose={onClose}
      widthClass="w-[min(100%,460px)]"
      className="overflow-hidden rounded-[14px] border border-[#e4e2dc] p-0 shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-col gap-1 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-[#9e9b96]">
          {isStarter ? 'Clearform Starter' : 'Publish Pass'}
        </p>
        <h3 className="pt-0.5 text-[18px] font-bold text-[#1a1a1c]">
          {title ?? (isStarter ? 'Upgrade to Starter' : 'Buy a Publish Pass')}
        </h3>
        {reason ? (
          <p className="text-[13px] leading-[20.8px] text-[#6b6966]">{reason}</p>
        ) : (
          <p className="text-[13px] leading-[20.8px] text-[#6b6966]">
            {isStarter
              ? '₹499/mo · unlimited publish · embed, Sheets, AI Insights.'
              : '₹99 one-time · publish one form · up to 100 responses.'}
          </p>
        )}
        {quota && Number.isFinite(quota.limit) ? (
          <p className="text-[12px] font-medium text-[#9e9b96]">
            {Math.min(quota.used, quota.limit)} of {quota.limit} used
          </p>
        ) : null}
        <ul className="flex flex-col gap-1.5 py-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13px] text-[#3d3c38]">
              <RiCheckLine size={16} className="mt-0.5 shrink-0 text-[#22a06b]" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isStarter ? (
            <button
              type="button"
              onClick={handleBuyPass}
              disabled={!!checkoutLoading}
              className="inline-flex items-center gap-1 rounded-[10px] bg-[#1a1a1c] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2c2c2e] disabled:opacity-60"
            >
              {checkoutLoading === 'pass' ? 'Opening…' : 'Buy ₹99'}
              <RiArrowRightLine size={16} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleBuyStarter}
            disabled={!!checkoutLoading}
            className={`inline-flex items-center gap-1 rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-colors disabled:opacity-60 ${
              isStarter
                ? 'bg-[#1a1a1c] text-white hover:bg-[#2c2c2e]'
                : 'border border-[#1a1a1c] bg-white text-[#1a1a1c] hover:bg-[#f7f7f5]'
            }`}
          >
            {checkoutLoading === 'starter' ? 'Opening…' : 'Starter — ₹499/mo'}
            <RiArrowRightLine size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium text-[#6b6966] hover:text-[#1a1a1c]"
          >
            Not now
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}

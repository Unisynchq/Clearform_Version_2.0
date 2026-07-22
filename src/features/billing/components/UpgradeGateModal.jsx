import { useCallback, useState } from 'react';
import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import { openPilotRazorpayCheckout } from '@/features/billing/utils/openPilotRazorpayCheckout';
import { useToast } from '@/hooks/useToast';

const PILOT_POINTS = [
  '300 responses · 90 days',
  '3 workspaces',
  'AI response quality (live nudges + scoring)',
  'AI logic generation & insights',
  'Premium AI models',
];

const WORKSPACE_PILOT_POINTS = [
  'Organise forms across teams, projects & clients',
  ...PILOT_POINTS,
];

/**
 * Reusable paywall modal shown when a free-tier user hits a hard limit
 * (responses cap, AI quota, workspace limit). Opens Razorpay checkout.
 *
 * Pass the server's UPGRADE_REQUIRED 403 body fields directly: `reason` takes
 * `message` and `quota` takes `{ used, limit }` for the usage line.
 *
 * @param {{ open: boolean, onClose: () => void, title?: string, reason?: string, quota?: { used: number, limit: number } }} props
 */
export default function UpgradeGateModal({ open, onClose, title, reason, quota }) {
  const { showToast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const isWorkspaceGate = /workspace/i.test(title ?? '') || /workspace/i.test(reason ?? '');
  const points = isWorkspaceGate ? WORKSPACE_PILOT_POINTS : PILOT_POINTS;

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
      className="overflow-hidden rounded-[14px] border border-[#e4e2dc] p-0 shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-col gap-1 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-[#9e9b96]">
          Clearform Pilot
        </p>
        <h3 className="pt-0.5 text-[18px] font-bold text-[#1a1a1c]">
          {title ?? 'Upgrade to keep going'}
        </h3>
        {reason ? (
          <p className="text-[13px] leading-[20.8px] text-[#6b6966]">{reason}</p>
        ) : (
          <p className="text-[13px] leading-[20.8px] text-[#6b6966]">
            $34.99 one-time · 90 days · 300 responses · AI quality scoring included.
          </p>
        )}
        {quota && Number.isFinite(quota.limit) ? (
          <p className="text-[12px] font-medium text-[#9e9b96]">
            {Math.min(quota.used, quota.limit)} of {quota.limit} used
          </p>
        ) : null}
        {quota && Number.isFinite(quota.limit) ? (
          <p className="text-[12px] font-medium text-white/40">
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
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            className="inline-flex items-center gap-1 rounded-[10px] bg-[#1a1a1c] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2c2c2e] disabled:opacity-60"
          >
            {checkoutLoading ? 'Opening checkout…' : 'Start Pilot — $34.99'}
            <RiArrowRightLine size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-[#6b6966] transition-colors hover:text-[#1a1a1c]"
          >
            Not now
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}

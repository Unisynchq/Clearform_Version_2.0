import { useState } from 'react';
import { RiArrowRightLine, RiSparklingLine } from 'react-icons/ri';
import UpgradeGateModal from '@/features/billing/components/UpgradeGateModal';
import { useBillingStatus } from '@/features/billing/utils/useBillingStatus';
import { isApiConfigured } from '@/config/env';

/**
 * Shown above AI surfaces for free-tier accounts: insights still run on the
 * free tier (rule-based, low hourly limits), but pro unlocks the full bundle.
 */
export default function AiTierTeaser() {
  const { status, aiTier } = useBillingStatus();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!isApiConfigured() || !status || aiTier === 'pro') return null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e5e3df] bg-[#fafaf8] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <RiSparklingLine size={18} className="mt-0.5 shrink-0 text-[#6b6b68]" aria-hidden />
          <p className="text-[12.5px] leading-[19px] text-[#555350]">
            You&apos;re on the free tier — insights use rule-based analysis with limited refreshes.
            <span className="font-medium text-[#111110]"> Pilot unlocks premium AI models</span> for
            insights, response quality, and logic generation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-[#1a1a18] px-3.5 py-1.5 text-[12.5px] font-medium text-[#1a1a18] transition-colors hover:bg-[#1a1a18] hover:text-white"
        >
          Upgrade
          <RiArrowRightLine size={13} aria-hidden />
        </button>
      </div>
      <UpgradeGateModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Unlock the full AI bundle"
        reason="Pilot routes your forms to premium AI models with higher limits for insights, quality scoring, and logic generation."
      />
    </>
  );
}

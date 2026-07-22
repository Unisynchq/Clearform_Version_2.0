import { useState } from 'react';
import { RiAlertLine, RiArrowRightLine } from 'react-icons/ri';
import UpgradeGateModal from '@/features/billing/components/UpgradeGateModal';
import { useBillingStatus } from '@/features/billing/utils/useBillingStatus';

/**
 * Blocking notice shown when the account has used up its response allowance —
 * mirrors the server-side cap (respondents are already rejected by the API).
 */
export default function ResponsesLimitBanner() {
  const { status } = useBillingStatus();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const used = status?.responsesUsed;
  const limit = status?.responsesLimit;
  const atLimit =
    typeof used === 'number' && typeof limit === 'number' && limit > 0 && used >= limit;

  if (!atLimit) return null;

  return (
    <>
      <div className="mx-6 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#f0c9c5] bg-[#fdf2f1] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <RiAlertLine size={18} className="mt-0.5 shrink-0 text-[#c74e43]" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold text-[#8e2f27]">
              Responses paused — plan limit reached
            </p>
            <p className="text-[12.5px] text-[#a05048]">
              Your forms have collected {used.toLocaleString('en-IN')} of {limit.toLocaleString('en-IN')} responses.
              New submissions are being rejected until you upgrade.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2d2d2b]"
        >
          Upgrade to Pilot
          <RiArrowRightLine size={14} aria-hidden />
        </button>
      </div>
      <UpgradeGateModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Response limit reached"
        reason="Free workspaces include 50 responses. Pilot adds 300 responses plus the full AI bundle."
      />
    </>
  );
}

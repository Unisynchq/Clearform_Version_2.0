import { useState } from 'react';
import { RiArrowRightLine } from 'react-icons/ri';
import { redeemPromoCode } from '@/api/services/billingService';
import { useToast } from '@/hooks/useToast';
import { trackPilotActivated, trackPromoRedeemed } from '@/analytics/track';

/**
 * Invite-only promo code redemption — pastes a shared code to unlock a
 * 7-day Pilot trial. Hidden behind a link so it doesn't compete with the
 * primary paid upgrade CTA; only ever shown to free-tier users.
 */
const PromoCodeRedeemBox = ({ onRedeemed }) => {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await redeemPromoCode(code);
      trackPromoRedeemed();
      trackPilotActivated({ source: 'promo' });
      showToast({
        type: 'success',
        message: 'Pilot trial activated — enjoy 7 days of full access.',
        duration: 5000,
      });
      setCode('');
      setExpanded(false);
      onRedeemed?.();
    } catch (err) {
      const message = err?.message ?? 'Could not redeem this code.';
      setError(message);
      showToast({ type: 'error', message, duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start text-[12px] font-medium text-[#888580] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#1a1a18]"
      >
        Have an invite code?
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-[10px] border border-[#e8e8e6] bg-[#f7f7f6] p-3.5"
    >
      <p className="text-[11px] font-medium text-[#555350]">
        Paste your invite code to unlock a 7-day Pilot trial
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          autoFocus
          disabled={submitting}
          className="min-w-0 flex-1 rounded-[7px] border border-[#e8e8e6] bg-white px-[11px] py-[9px] text-[12px] uppercase text-[#1a1a18] outline-none placeholder:normal-case placeholder:text-[#888580] focus:border-[#1a1a18] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="inline-flex items-center gap-1 rounded-[7px] bg-[#1a1a18] px-3.5 py-[9px] text-[12px] font-medium text-white transition-colors hover:bg-[#2d2d2b] disabled:opacity-60"
        >
          {submitting ? 'Redeeming…' : 'Redeem'}
          {!submitting ? <RiArrowRightLine size={14} aria-hidden /> : null}
        </button>
      </div>
      {error ? <p className="text-[11px] text-[#c74e43]">{error}</p> : null}
    </form>
  );
};

export default PromoCodeRedeemBox;

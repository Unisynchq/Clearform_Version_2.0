import { useState } from 'react';
import { RiCheckLine } from 'react-icons/ri';
import {
  PROMO_CLEAR20,
  calculateCheckoutSummary,
  formatRenewalDate,
} from '@/features/profile/utils/profileBillingCheckout';
import { formatInr } from '@/features/profile/utils/profilePlanCatalog';

const fieldClass =
  'w-full rounded-[7px] border border-[#e8e8e6] bg-white px-[11px] py-[9px] text-[12px] text-[#1a1a18] outline-none placeholder:text-[#757575] focus:border-[#1a1a18]';

const CheckoutOrderSummary = ({
  selection,
  variant = 'card',
  promoInput = false,
  onPromoApply,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const effectivePromo =
    variant === 'card' && selection?.planId === 'pro' ? true : promoApplied;

  const summary = calculateCheckoutSummary({
    ...selection,
    promoApplied: effectivePromo,
  });

  if (!summary) return null;

  const handleApplyPromo = () => {
    const normalized = promoCode.trim().toUpperCase();
    if (normalized === PROMO_CLEAR20.code) {
      setPromoApplied(true);
      onPromoApply?.(true);
    } else {
      setPromoApplied(false);
      onPromoApply?.(false);
    }
  };

  const isCard = variant === 'card';

  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 bg-white p-5 sm:w-[256px]">
      <h3 className="text-[13px] font-semibold text-[#1a1a18]">Order summary</h3>

      <div className="rounded-[10px] bg-[#f0f0ee] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-[#1a1a18]">
            {summary.planLabel}
          </span>
          {summary.showNewBadge && isCard ? (
            <span className="rounded-full bg-[#1a1a18] px-1.5 py-0.5 text-[9px] font-medium text-white">
              NEW
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-[#888580]">
          {summary.intervalLabel} · Starts today
        </p>

        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[12px] text-[#555350]">
            <span>{summary.lineLabel}</span>
            <span>{formatInr(summary.baseMonthly)}</span>
          </div>
          {summary.promoDiscount > 0 ? (
            <div className="flex justify-between text-[12px] text-[#2d7d32]">
              <span>Promo — {summary.promoCode}</span>
              <span>−{formatInr(summary.promoDiscount)}</span>
            </div>
          ) : null}
          {isCard && summary.promoDiscount > 0 ? (
            <div className="flex justify-between pt-0.5 text-[12px] text-[#555350]">
              <span>Subtotal</span>
              <span>{formatInr(summary.subtotal)}</span>
            </div>
          ) : null}
          <div className="flex justify-between pb-1.5 pt-0.5 text-[12px] text-[#555350]">
            <span>GST (18%)</span>
            <span>{formatInr(summary.gst)}</span>
          </div>
        </div>

        <div className="h-px bg-[#e8e8e6]" aria-hidden />

        <div className="flex justify-between pt-1.5 text-[14px] font-semibold text-[#1a1a18]">
          <span>{isCard ? 'Total today' : 'Total'}</span>
          <span>{formatInr(isCard ? summary.totalToday : summary.renewMonthly)}</span>
        </div>
      </div>

      {isCard && summary.promoApplied ? (
        <div className="flex items-start gap-1.5 rounded-[8px] bg-[#e8f5e9] px-3 py-2 text-[12px] text-[#2d7d32]">
          <RiCheckLine size={13} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Code {summary.promoCode} applied — save {formatInr(summary.promoDiscount)}
          </span>
        </div>
      ) : null}

      {isCard ? (
        <p className="text-[11px] leading-[17.6px] text-[#888580]">
          Auto-renews at {formatInr(summary.renewMonthly)}/mo (incl. GST) on{' '}
          {formatRenewalDate()}. Cancel anytime.
        </p>
      ) : null}

      {promoInput ? (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Promo code"
            className={fieldClass}
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            className="shrink-0 rounded-[7px] border border-[#e8e8e6] bg-white px-3 py-[9px] text-[12px] font-medium text-[#555350] hover:bg-[#f7f7f6]"
          >
            Apply
          </button>
        </div>
      ) : null}

      {!isCard ? (
        <p className="text-[11px] leading-[17.6px] text-[#888580]">
          Cancel anytime. Your data stays accessible on the pilot program.
        </p>
      ) : null}

      {variant === 'netbanking' ? (
        <p className="text-[12px] leading-[19.2px] text-[#888580]">
          You&apos;ll be redirected to your bank&apos;s secure page to complete payment.
        </p>
      ) : null}

      {isCard ? (
        <div className="border-t border-[#f0f0ee] pt-4">
          <p className="text-[11px] font-semibold text-[#555350]">What you unlock</p>
          <ul className="mt-2 space-y-2">
            {summary.unlockHighlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[11.5px] text-[#555350]">
                <RiCheckLine size={13} className="shrink-0 text-[#2d7d32]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
};

export default CheckoutOrderSummary;

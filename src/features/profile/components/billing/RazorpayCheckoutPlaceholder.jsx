import { RiLockLine } from 'react-icons/ri';
import { RAZORPAY_CHECKOUT_ENABLED } from '@/constants/checkoutFlags';
import {
  calculateCheckoutSummary,
  getPaidPlan,
} from '@/features/profile/utils/profileBillingCheckout';
import { formatInr } from '@/features/profile/utils/profilePlanCatalog';

const METHOD_LABELS = {
  card: 'Card',
  upi: 'UPI',
  netbanking: 'Net Banking',
  more: 'More methods',
};

const placeholderShell =
  'flex min-h-[240px] flex-col items-center justify-center rounded-[10px] border border-dashed border-[#c9c6c0] bg-[#fafaf8] px-6 py-8 text-center';

/**
 * Razorpay integration surface — replaces mock card/UPI forms until checkout is wired.
 */
const RazorpayCheckoutPlaceholder = ({
  selection,
  paymentMethod = 'card',
  variant = 'payment',
  onContinue,
}) => {
  const plan = getPaidPlan(selection?.planId);
  const summary = selection ? calculateCheckoutSummary(selection) : null;
  const methodLabel = METHOD_LABELS[paymentMethod] ?? 'Payment';

  if (variant === 'summary') {
    return (
      <aside className="flex w-full shrink-0 flex-col gap-3 bg-white p-5 sm:w-[256px]">
        <h3 className="text-[13px] font-semibold text-[#1a1a18]">Order summary</h3>
        {summary ? (
          <div className="rounded-[10px] bg-[#f0f0ee] px-3 py-2.5 text-left">
            <p className="text-[12px] font-medium text-[#1a1a18]">{summary.planLabel}</p>
            <p className="text-[11px] text-[#888580]">{summary.intervalLabel}</p>
            <p className="mt-2 text-[13px] font-semibold text-[#1a1a18]">
              {formatInr(summary.totalToday)}
              <span className="text-[11px] font-normal text-[#888580]"> incl. GST</span>
            </p>
          </div>
        ) : null}
        <div className={placeholderShell}>
          <p className="text-[14px] font-semibold tracking-[-0.2px] text-[#1a1a18]">Razorpay</p>
          <p className="mt-2 max-w-[200px] text-[12px] leading-[18px] text-[#888580]">
            Order summary and payment confirmation will appear here after Razorpay checkout.
          </p>
        </div>
        <p className="flex items-center justify-center gap-1 text-[10.5px] text-[#888580]">
          <RiLockLine size={10} aria-hidden />
          Secured by Razorpay
        </p>
      </aside>
    );
  }

  return (
    <div className={placeholderShell}>
      <p className="text-[15px] font-semibold tracking-[-0.2px] text-[#1a1a18]">Razorpay</p>
      <p className="mt-2 max-w-[280px] text-[13px] leading-[19.5px] text-[#888580]">
        {plan?.name ?? 'Plan'} · {summary?.intervalLabel ?? 'Billing'} ·{' '}
        <span className="font-medium text-[#555350]">{methodLabel}</span>
      </p>
      <p className="mt-1 text-[12px] text-[#9e9e9a]">
        Checkout widget loads here for the method selected above.
      </p>
      {summary ? (
        <p className="mt-4 text-[13px] font-medium text-[#1a1a18]">
          {formatInr(summary.totalToday)} due today
        </p>
      ) : null}
      {!RAZORPAY_CHECKOUT_ENABLED ? (
        <p className="mt-4 max-w-[300px] rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[12px] leading-[18px] text-[#92400e]">
          Paid checkout opens after Razorpay is enabled for production. You stay on the pilot
          program until then.
        </p>
      ) : null}
      {onContinue ? (
        <button
          type="button"
          disabled={!RAZORPAY_CHECKOUT_ENABLED}
          onClick={() => {
            if (!RAZORPAY_CHECKOUT_ENABLED) return;
            onContinue?.({ paymentMethod });
          }}
          className="mt-5 inline-flex items-center justify-center rounded-[10px] bg-[#1a1a18] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d2d2b] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Continue with Razorpay →
        </button>
      ) : null}
      <p className="mt-4 flex items-center gap-1 text-[10.5px] text-[#888580]">
        <RiLockLine size={10} aria-hidden />
        Secured by Razorpay · 256-bit SSL
      </p>
    </div>
  );
};

export default RazorpayCheckoutPlaceholder;

import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import CheckoutResultLayout from '@/features/profile/components/billing/CheckoutResultLayout';
import {
  calculateCheckoutSummary,
  formatInr,
  formatNextBillingDate,
  getSuccessTitle,
} from '@/features/profile/utils/profileBillingCheckout';
import { buildTaxInvoice } from '@/features/profile/utils/profileBillingInvoice';
import { downloadTaxInvoicePdf } from '@/features/profile/utils/downloadTaxInvoice';

const CONFETTI_DOTS = ['#fbbf24', '#86efac', '#93c5fd', '#e8473f', '#fbbf24'];

const SummaryRow = ({ label, value, valueClassName = 'text-[#1a1a18]' }) => (
  <div className="flex justify-between text-[12px]">
    <span className="text-[#555350]">{label}</span>
    <span className={`font-medium ${valueClassName}`}>{value}</span>
  </div>
);

const BillingPaymentSuccess = ({ selection, paymentContext, customer, onClose }) => {
  const navigate = useNavigate();
  const promoApplied =
    paymentContext?.paymentMethod === 'card' && selection?.planId === 'pro';
  const summary = calculateCheckoutSummary({ ...selection, promoApplied });

  const invoice =
    summary &&
    buildTaxInvoice(
      {
        planId: selection.planId,
        interval: selection.interval,
        promoApplied,
        paymentContext,
        activatedAt: Date.now(),
      },
      customer
    );

  if (!summary) return null;

  const planLine = `${summary.plan.name} · ${summary.intervalLabel}`;

  const handleDashboard = () => {
    onClose?.();
    navigate('/dashboard');
  };

  return (
    <CheckoutResultLayout activeStepId="confirm" allStepsComplete>
      <div className="flex w-full max-w-[344px] flex-col items-center">
        <div className="mb-3.5 flex gap-1">
          {CONFETTI_DOTS.map((color, i) => (
            <span
              key={i}
              className="size-[7px] rounded-[3.5px]"
              style={{ backgroundColor: color }}
              aria-hidden
            />
          ))}
        </div>
        <div className="mb-3.5 flex size-[52px] items-center justify-center rounded-full bg-[#e8f5e9]">
          <RiCheckLine size={24} className="text-[#2d7d32]" aria-hidden />
        </div>

        <h2 className="text-center text-[18px] font-bold text-[#1a1a18]">
          {getSuccessTitle(selection.planId)}{' '}
          <span role="img" aria-label="celebration">
            🎉
          </span>
        </h2>
        <p className="mt-1.5 max-w-[280px] text-center text-[13px] leading-[20.8px] text-[#888580]">
          All {summary.plan.name} features are unlocked and ready. Welcome to the team.
        </p>

        <div className="mt-5 w-full rounded-[10px] bg-[#f0efec] px-[18px] py-3.5">
          <div className="flex flex-col gap-[7px]">
            <SummaryRow label="Plan" value={planLine} />
            <SummaryRow label="Subtotal" value={formatInr(summary.subtotal)} />
            {summary.promoDiscount > 0 ? (
              <SummaryRow
                label={`Discount (${summary.promoCode})`}
                value={`−${formatInr(summary.promoDiscount)}`}
                valueClassName="text-[#2d7d32]"
              />
            ) : null}
            <SummaryRow label="GST 18%" value={formatInr(summary.gst)} />
            <div className="h-px bg-[#e5e3df]" aria-hidden />
            <div className="flex justify-between pt-0.5 text-[12px]">
              <span className="font-semibold text-[#555350]">Total paid</span>
              <span className="text-[15px] font-medium text-[#1a1a18]">
                {formatInr(summary.totalToday)}
              </span>
            </div>
            <SummaryRow label="Next billing" value={formatNextBillingDate()} />
            <div className="flex justify-between text-[12px]">
              <span className="text-[#555350]">Receipt</span>
              <button
                type="button"
                className="font-medium text-[#1a1a18] underline decoration-solid underline-offset-2"
                onClick={() => invoice && downloadTaxInvoicePdf(invoice)}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDashboard}
          className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-[10px] bg-[#1a1a18] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#2d2b28]"
        >
          Go to dashboard
          <RiArrowRightLine size={16} aria-hidden />
        </button>
      </div>
    </CheckoutResultLayout>
  );
};

export default BillingPaymentSuccess;

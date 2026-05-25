import { useEffect, useState } from 'react';
import CheckoutResultLayout from '@/features/profile/components/billing/CheckoutResultLayout';
import {
  calculateCheckoutSummary,
  createPaymentReference,
  formatInr,
  getUpiAppLabel,
} from '@/features/profile/utils/profileBillingCheckout';

const PRO_ACCENT = '#e8473f';
const DEMO_AWAIT_SEC = 6;
const INITIAL_COUNTDOWN_SEC = 9 * 60 + 42;

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const DetailRow = ({ label, value, valueClassName = 'text-[#1a1a18]', valueStyle }) => (
  <div className="flex justify-between text-[12px]">
    <span className="text-[#555350]">{label}</span>
    <span className={`font-medium ${valueClassName}`} style={valueStyle}>
      {value}
    </span>
  </div>
);

const BillingPaymentAwaiting = ({
  selection,
  paymentContext,
  onTryAnotherMethod,
  onComplete,
}) => {
  const summary = calculateCheckoutSummary({ ...selection, promoApplied: false });
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN_SEC);
  const refNo = createPaymentReference();
  const upiAppLabel = getUpiAppLabel(paymentContext?.upiApp ?? 'phonepe');

  useEffect(() => {
    let elapsed = 0;
    const timer = window.setInterval(() => {
      elapsed += 1;
      setSecondsLeft((s) => Math.max(0, s - 1));
      if (elapsed >= DEMO_AWAIT_SEC) {
        window.clearInterval(timer);
        onComplete?.();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onComplete]);

  if (!summary) return null;

  return (
    <CheckoutResultLayout activeStepId="payment">
      <div className="flex w-full max-w-[310px] flex-col items-center">
        <div
          className="mb-4 size-11 animate-spin rounded-[22px] border-[3px] border-[#1a1a18] border-t-transparent"
          aria-hidden
        />
        <h2 className="text-center text-[16px] font-semibold text-[#1a1a18]">
          Waiting for payment
        </h2>
        <p className="mt-1.5 text-center text-[13px] leading-[20.8px] text-[#888580]">
          Approve the request in your {upiAppLabel} app. This updates automatically.
        </p>

        <div className="mt-4 w-full rounded-[10px] bg-[#f0efec] px-[18px] py-3.5">
          <div className="flex flex-col gap-[7px]">
            <DetailRow label="Amount" value={formatInr(summary.renewMonthly)} />
            <DetailRow label="UPI ID" value={paymentContext?.upiId ?? '—'} />
            <DetailRow label="Ref no." value={refNo} valueClassName="text-[11px]" />
            <DetailRow
              label="Expires in"
              value={formatCountdown(secondsLeft)}
              valueStyle={{ color: PRO_ACCENT }}
            />
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] text-[#888580]">
          Didn&apos;t get the request?{' '}
          <button
            type="button"
            onClick={onTryAnotherMethod}
            className="font-normal text-[#1a1a18] underline decoration-solid underline-offset-2"
          >
            Try another method
          </button>
        </p>
      </div>
    </CheckoutResultLayout>
  );
};

export default BillingPaymentAwaiting;

import { RiCloseLine } from 'react-icons/ri';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import {
  calculateCheckoutSummary,
  formatAttemptedAt,
  formatInr,
} from '@/features/profile/utils/profileBillingCheckout';

const PRO_ACCENT = '#e8473f';

const DetailRow = ({ label, value, valueClassName = 'text-[#1a1a18]' }) => (
  <div className="flex justify-between text-[12px]">
    <span className="text-[#555350]">{label}</span>
    <span className={`font-medium ${valueClassName}`}>{value}</span>
  </div>
);

const BillingPaymentFailed = ({ selection, onTryAgain, onDifferentMethod }) => {
  const summary = calculateCheckoutSummary({ ...selection, promoApplied: false });

  if (!summary) return null;

  return (
    <div className="flex flex-col">
      <div className="border-b border-[#e5e3df] px-5 py-3">
        <img
          src={clearformLogo}
          alt="Clearform"
          className="h-7 w-auto max-w-[118px] object-contain object-left"
        />
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-7">
        <div className="flex w-full max-w-[330px] flex-col items-center">
          <div className="mb-3.5 flex size-[52px] items-center justify-center rounded-full bg-[#fdf0ef]">
            <RiCloseLine size={24} className="text-[#e8473f]" aria-hidden />
          </div>

          <h2 className="text-center text-[18px] font-bold text-[#1a1a18]">Payment failed</h2>
          <p className="mt-1.5 text-center text-[13px] leading-[20.8px] text-[#888580]">
            Your card was declined. No amount was charged. Please check your card details or
            try another method.
          </p>

          <div className="mt-4 w-full rounded-[10px] bg-[#f0efec] px-[18px] py-3.5">
            <div className="flex flex-col gap-[7px]">
              <DetailRow
                label="Error code"
                value="CARD_DECLINED"
                valueClassName="text-[#e8473f]"
              />
              <DetailRow label="Amount" value={formatInr(summary.renewMonthly)} />
              <DetailRow label="Attempted" value={formatAttemptedAt()} />
            </div>
          </div>

          <button
            type="button"
            onClick={onTryAgain}
            className="mt-4 w-full rounded-[10px] px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRO_ACCENT }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onDifferentMethod}
            className="mt-2 w-full rounded-[8px] border border-[#e5e3df] px-[17px] py-[9px] text-[13px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6]"
          >
            Use a different method
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingPaymentFailed;

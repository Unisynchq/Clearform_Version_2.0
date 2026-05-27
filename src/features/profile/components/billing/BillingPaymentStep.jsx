import { useState } from 'react';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import CheckoutStepper from '@/features/profile/components/billing/CheckoutStepper';
import RazorpayCheckoutPlaceholder from '@/features/profile/components/billing/RazorpayCheckoutPlaceholder';
import { PaymentMethodTabs } from '@/features/profile/components/billing/BillingPaymentForms';

const BillingPaymentStep = ({ selection, onBack, onPay }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');

  return (
    <div className="flex max-h-[min(92vh,671px)] flex-col">
      <div className="flex items-center justify-between border-b border-[#e8e8e6] px-5 py-3">
        <img
          src={clearformLogo}
          alt="Clearform"
          className="h-7 w-auto max-w-[118px] object-contain object-left"
        />
        <span className="rounded-full bg-[#f0f0ee] px-[9px] py-[3px] text-[11px] font-medium text-[#555350]">
          Secure checkout
        </span>
      </div>

      <CheckoutStepper activeStepId="payment" />

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <div className="min-w-0 flex-1 overflow-y-auto border-[#e8e8e6] sm:border-r">
          <div className="flex flex-col gap-3 px-7 pb-6 pt-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-[#1a1a18]">Payment details</h2>
              <button
                type="button"
                onClick={onBack}
                className="shrink-0 rounded-[8px] border border-[#e8e8e6] px-[13px] py-[7px] text-[12px] font-medium text-[#1a1a18] hover:bg-[#f7f7f6]"
              >
                Back
              </button>
            </div>

            <PaymentMethodTabs method={paymentMethod} onChange={setPaymentMethod} />

            <RazorpayCheckoutPlaceholder
              selection={selection}
              paymentMethod={paymentMethod}
              variant="payment"
              onContinue={(ctx) => onPay?.({ ...ctx, paymentMethod })}
            />
          </div>
        </div>

        <RazorpayCheckoutPlaceholder
          selection={selection}
          paymentMethod={paymentMethod}
          variant="summary"
        />
      </div>
    </div>
  );
};

export default BillingPaymentStep;

import { useEffect, useRef, useState } from 'react';
import {
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiLockLine,
} from 'react-icons/ri';
/**
 * Pro / Starter plan picker — not used in production (pilot-only billing).
 * ProfileBillingPanel uses openPilotRazorpayCheckout directly.
 * Re-enable when monthly/yearly Razorpay Subscription plans ship.
 */
import { redirectToCheckout } from '@/api/services/billingService';
import { isApiConfigured } from '@/config/env';
import ProfileModal from '@/components/profile/ProfileModal';
import BillingPaymentAwaiting from '@/features/profile/components/billing/BillingPaymentAwaiting';
import BillingPaymentFailed from '@/features/profile/components/billing/BillingPaymentFailed';
import BillingPaymentStep from '@/features/profile/components/billing/BillingPaymentStep';
import BillingPaymentSuccess from '@/features/profile/components/billing/BillingPaymentSuccess';
import { resolvePaymentOutcome, isDemoBillingCheckoutEnabled } from '@/features/profile/utils/profileBillingCheckout';
import { createSubscriptionFromCheckout } from '@/features/profile/utils/profileBillingInvoice';
import { writeBillingSubscription } from '@/features/profile/utils/profileBillingStorage';
import { useToast } from '@/hooks/useToast';
import { CHECKOUT_STEPS } from '@/features/profile/utils/profilePlanCatalog';
import {
  BILLING_INTERVALS,
  PAID_PLANS,
  formatInr,
  getPlanDisplayPrice,
} from '@/features/profile/utils/profilePlanCatalog';

const MODAL_WIDTH = {
  plan: 'w-[min(100%,680px)]',
  payment: 'w-[min(100%,660px)]',
  awaiting: 'w-[min(100%,360px)]',
  success: 'w-[min(100%,400px)]',
  failed: 'w-[min(100%,380px)]',
};

const PRO_ACCENT = '#e8473f';

const PlanStepStepper = () => (
  <div className="flex items-center border-b border-[#e8e8e6] px-7 pb-[15px] pt-3.5">
    {CHECKOUT_STEPS.map((step, index) => {
      const isActive = step.id === 'plan';
      const isLast = index === CHECKOUT_STEPS.length - 1;

      return (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-[7px]">
            <span
              className={`flex size-[22px] items-center justify-center rounded-[11px] border text-[11px] font-semibold ${
                isActive
                  ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                  : 'border-[#c9c6c0] bg-transparent text-[#888580]'
              }`}
            >
              {step.number}
            </span>
            <span
              className={`text-[12px] font-medium whitespace-nowrap ${
                isActive ? 'text-[#1a1a18]' : 'text-[#888580]'
              }`}
            >
              {step.label}
            </span>
          </div>
          {!isLast ? (
            <div className="mx-2 h-px w-[60px] max-w-[60px] bg-[#e8e8e6]" aria-hidden />
          ) : null}
        </div>
      );
    })}
  </div>
);

const BillingToggle = ({ interval, onChange }) => (
  <div
    className="flex gap-0.5 rounded-[8px] bg-[#f0f0ee] p-[3px]"
    role="group"
    aria-label="Billing interval"
  >
    {BILLING_INTERVALS.map((key) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`flex items-center gap-1 rounded-[6px] px-3.5 py-[5px] text-[12px] font-medium transition-colors ${
          interval === key
            ? 'bg-white text-[#1a1a18] shadow-[0_1px_1.5px_rgba(0,0,0,0.08)]'
            : 'text-[#888580] hover:text-[#1a1a18]'
        }`}
        aria-pressed={interval === key}
      >
        {key === 'monthly' ? 'Monthly' : 'Yearly'}
        {key === 'yearly' ? (
          <span className="rounded-[10px] bg-[#e8f5e9] px-[7px] py-0.5 text-[10px] font-semibold text-[#2d7d32]">
            –20%
          </span>
        ) : null}
      </button>
    ))}
  </div>
);

const PlanFeature = ({ text, included, dark }) => (
  <li className="flex items-start gap-2 pt-[5.5px] first:pt-[11.5px]">
    {included ? (
      <RiCheckLine
        size={13}
        className={`mt-0.5 shrink-0 ${dark ? 'text-[#4ade80]' : 'text-[#2d7d32]'}`}
        aria-hidden
      />
    ) : (
      <RiCloseLine size={13} className="mt-0.5 shrink-0 text-[#c9c6c0]" aria-hidden />
    )}
    <span
      className={`text-[12px] leading-[16.8px] ${
        included
          ? dark
            ? 'text-white/70'
            : 'text-[#555350]'
          : 'text-[#c9c6c0]'
      }`}
    >
      {text}
    </span>
  </li>
);

const StarterPlanCard = ({ plan, interval, onSelect, checkoutLoading = false }) => {
  const price = getPlanDisplayPrice(plan, interval);

  return (
    <article className="flex flex-col rounded-[12px] border border-[#e8e8e6] bg-white px-[21px] pb-[23px] pt-[21px]">
      <h3 className="text-[15px] font-semibold text-[#1a1a18]">{plan.name}</h3>
      <p className="text-[12px] text-[#888580]">{plan.tagline}</p>
      <div className="flex items-end gap-0.5 pt-3">
        <span className="text-[28px] font-bold leading-[28px] text-[#1a1a18]">
          {formatInr(price)}
        </span>
        <span className="pb-0.5 text-[13px] text-[#888580]">/ month</span>
      </div>
      <p className="pb-3.5 text-[11px] text-[#888580]">
        {interval === 'yearly' ? 'Billed yearly' : 'Billed monthly'} · Cancel anytime
      </p>
      <div className="mb-3.5 h-px bg-[#f0f0ee]" aria-hidden />
      <ul className="mb-3.5 flex-1 list-none p-0">
        {plan.features.map((feature) => (
          <PlanFeature key={feature.text} {...feature} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        disabled={checkoutLoading}
        className="w-full rounded-[8px] border border-[#e8e8e6] px-[17px] py-[9px] text-[13px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6] disabled:opacity-60"
      >
        {checkoutLoading ? 'Opening checkout…' : plan.ctaLabel}
      </button>
    </article>
  );
};

const ProPlanCard = ({ plan, interval, onSelect, checkoutLoading = false }) => {
  const price = getPlanDisplayPrice(plan, interval);

  return (
    <article className="relative flex flex-col rounded-[12px] border border-[#1a1a18] bg-[#1a1a18] px-[21px] pb-[21px] pt-[21px]">
      {plan.badge ? (
        <span
          className="absolute left-5 top-[-10px] rounded-[20px] px-2.5 py-[3px] text-[10px] font-semibold tracking-[0.6px] text-white"
          style={{ backgroundColor: PRO_ACCENT }}
        >
          {plan.badge}
        </span>
      ) : null}
      <h3 className="text-[15px] font-semibold text-white">{plan.name}</h3>
      <p className="text-[12px] text-white/50">{plan.tagline}</p>
      <div className="flex items-end gap-0.5 pt-3">
        <span className="text-[28px] font-bold leading-[28px] text-white">
          {formatInr(price)}
        </span>
        <span className="pb-0.5 text-[13px] text-white/40">/ month</span>
      </div>
      <p className="pb-3.5 text-[11px] text-white/40">
        {interval === 'yearly' ? 'Billed yearly' : 'Billed monthly'} · Cancel anytime
      </p>
      <div className="mb-3.5 h-px bg-white/10" aria-hidden />
      <ul className="mb-3.5 flex-1 list-none p-0">
        {plan.features.map((feature) => (
          <PlanFeature key={feature.text} {...feature} dark included={feature.included} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        disabled={checkoutLoading}
        className="inline-flex w-full items-center justify-center gap-1 rounded-[8px] px-4 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: PRO_ACCENT }}
      >
        {checkoutLoading ? 'Opening checkout…' : plan.ctaLabel}
        {!checkoutLoading ? <RiArrowRightLine size={14} aria-hidden /> : null}
      </button>
    </article>
  );
};

const BillingChoosePlanModal = ({
  open,
  onClose,
  onBillingUpdated,
  customerEmail,
  customer,
}) => {
  const { showToast } = useToast();
  const demoCheckout = isDemoBillingCheckoutEnabled();
  const [step, setStep] = useState('plan');
  const [interval, setInterval] = useState('monthly');
  const [selection, setSelection] = useState(null);
  const [paymentContext, setPaymentContext] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const persistedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setStep('plan');
      setInterval('monthly');
      setSelection(null);
      setPaymentContext(null);
      persistedRef.current = false;
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleBackFromPlan = () => {
    handleClose();
  };

  const handleBackFromPayment = () => {
    setStep('plan');
  };

  const handleSelectPlan = async (planId) => {
    if (isApiConfigured()) {
      setCheckoutLoading(true);
      try {
        await redirectToCheckout({ planId, interval });
      } catch (err) {
        showToast({
          type: 'error',
          message: err?.message ?? 'Could not start checkout.',
          duration: 6000,
        });
        setCheckoutLoading(false);
      }
      return;
    }
    setSelection({ planId, interval });
    setStep('payment');
  };

  const handlePay = (context) => {
    if (!demoCheckout) return;
    setPaymentContext(context);
    const outcome = resolvePaymentOutcome(context);
    if (outcome === 'awaiting') setStep('awaiting');
    else if (outcome === 'failed') setStep('failed');
    else setStep('success');
  };

  const handleAwaitingComplete = () => setStep('success');

  const handleBackToPayment = () => setStep('payment');

  const persistSubscription = () => {
    if (!demoCheckout || !customerEmail || !selection) return;
    const subscription = createSubscriptionFromCheckout({
      planId: selection.planId,
      interval: selection.interval,
      paymentContext,
    });
    writeBillingSubscription(customerEmail, subscription);
    onBillingUpdated?.();
  };

  useEffect(() => {
    if (!demoCheckout || step !== 'success' || !selection || persistedRef.current) return;
    persistedRef.current = true;
    persistSubscription();
  }, [step, selection, customerEmail, paymentContext, onBillingUpdated, demoCheckout]);

  const [starterPlan, proPlan] = PAID_PLANS;

  const renderCheckoutStep = () => {
    if (!demoCheckout) return null;
    if (step === 'awaiting' && selection) {
      return (
        <BillingPaymentAwaiting
          selection={selection}
          paymentContext={paymentContext}
          onTryAnotherMethod={handleBackToPayment}
          onComplete={handleAwaitingComplete}
        />
      );
    }
    if (step === 'success' && selection) {
      return (
        <BillingPaymentSuccess
          selection={selection}
          paymentContext={paymentContext}
          customer={customer}
          onClose={handleClose}
        />
      );
    }
    if (step === 'failed' && selection) {
      return (
        <BillingPaymentFailed
          selection={selection}
          onTryAgain={handleBackToPayment}
          onDifferentMethod={handleBackToPayment}
        />
      );
    }
    if (step === 'payment' && selection) {
      return (
        <BillingPaymentStep
          selection={selection}
          onBack={handleBackFromPayment}
          onPay={handlePay}
        />
      );
    }
    return null;
  };

  const checkoutBody = renderCheckoutStep();

  return (
    <ProfileModal
      open={open}
      onClose={handleClose}
      widthClass={MODAL_WIDTH[step] ?? MODAL_WIDTH.plan}
      className="overflow-hidden rounded-[14px] border border-[#c8c5c0] bg-[#eeecea] p-0 shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]"
    >
      {checkoutBody ?? (
        <div className="flex max-h-[min(92vh,620px)] flex-col">
          <div className="flex items-center justify-end gap-2 border-b border-[#e8e8e6] px-5 py-3">
            <button
              type="button"
              onClick={handleBackFromPlan}
              className="rounded-[8px] border border-[#e8e8e6] px-[13px] py-[7px] text-[12px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6]"
            >
              Back
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f0ee] px-[9px] py-[3px] text-[11px] font-medium text-[#555350]">
              <RiLockLine size={12} className="text-[#888580]" aria-hidden />
              Secure checkout
            </span>
          </div>

          <PlanStepStepper />

          <div className="flex-1 overflow-y-auto px-7 pb-6 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-bold text-[#1a1a18]">Choose your plan</h2>
                <p className="mt-0.5 text-[13px] text-[#888580]">
                  Pilot pricing. Cancel anytime.
                </p>
              </div>
              <BillingToggle interval={interval} onChange={setInterval} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StarterPlanCard
                plan={starterPlan}
                interval={interval}
                onSelect={handleSelectPlan}
                checkoutLoading={checkoutLoading}
              />
              <ProPlanCard
                plan={proPlan}
                interval={interval}
                onSelect={handleSelectPlan}
                checkoutLoading={checkoutLoading}
              />
            </div>

            <p className="mt-4 text-center text-[12px] text-[#888580]">
              All plans include GST. Prices shown in INR.
            </p>
          </div>
        </div>
      )}
    </ProfileModal>
  );
};

export default BillingChoosePlanModal;

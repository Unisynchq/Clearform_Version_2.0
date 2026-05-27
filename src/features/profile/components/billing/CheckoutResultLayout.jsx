import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import CheckoutStepper from '@/features/profile/components/billing/CheckoutStepper';

const CheckoutResultLayout = ({
  activeStepId,
  allStepsComplete = false,
  showStepper = true,
  compactStepper = true,
  children,
}) => (
  <div className="flex flex-col">
    <div className="border-b border-[#e5e3df] px-5 py-3">
      <img
        src={clearformLogo}
        alt="Clearform"
        className="h-7 w-auto max-w-[118px] object-contain object-left"
      />
    </div>
    {showStepper ? (
      <CheckoutStepper
        activeStepId={activeStepId}
        allComplete={allStepsComplete}
        compact={compactStepper}
      />
    ) : null}
    <div className="flex flex-col items-center justify-center px-6 py-7">{children}</div>
  </div>
);

export default CheckoutResultLayout;

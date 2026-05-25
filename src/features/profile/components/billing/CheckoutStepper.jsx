import { RiCheckLine } from 'react-icons/ri';
import { CHECKOUT_STEPS } from '@/features/profile/utils/profilePlanCatalog';

const CheckoutStepper = ({ activeStepId, allComplete = false, compact = false }) => {
  const activeIndex = CHECKOUT_STEPS.findIndex((s) => s.id === activeStepId);

  return (
    <div
      className={`flex items-center justify-center border-b border-[#e5e3df] pb-[15px] pt-3.5 ${
        compact ? 'px-5' : 'px-7'
      }`}
    >
      {CHECKOUT_STEPS.map((step, index) => {
        const isActive = !allComplete && index === activeIndex;
        const isPast = allComplete || index < activeIndex;
        const isLast = index === CHECKOUT_STEPS.length - 1;
        const connectorClass = isPast ? 'bg-[#2d7d32]' : 'bg-[#e8e8e6]';

        return (
          <div key={step.id} className="flex shrink-0 items-center">
            <div className="flex shrink-0 items-center gap-[7px]">
              {isPast ? (
                <span className="flex size-[22px] items-center justify-center rounded-[11px] border border-[#2d7d32] bg-[#2d7d32] text-white">
                  <RiCheckLine size={10} aria-hidden />
                </span>
              ) : (
                <span
                  className={`flex size-[22px] items-center justify-center rounded-[11px] border text-[11px] font-semibold ${
                    isActive
                      ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                      : 'border-[#c9c6c0] bg-transparent text-[#888580]'
                  }`}
                >
                  {step.number}
                </span>
              )}
              <span
                className={`text-[12px] font-medium whitespace-nowrap ${
                  isPast
                    ? 'text-[#2d7d32]'
                    : isActive
                      ? 'text-[#1a1a18]'
                      : 'text-[#888580]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={`h-px shrink-0 ${connectorClass} ${
                  compact ? 'mx-1 w-[40px]' : 'mx-2 w-[60px] max-w-[60px]'
                }`}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutStepper;

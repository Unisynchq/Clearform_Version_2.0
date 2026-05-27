import { RiArrowRightSLine } from 'react-icons/ri';

const STEPS = [
  { id: 1, label: 'Choose use case' },
  { id: 2, label: 'Template preview' },
  { id: 3, label: 'Form builder' },
  { id: 4, label: 'Publish' },
];

const FormBuilderStepBar = ({ activeStep = 3 }) => (
  <div className="flex items-center">
    {STEPS.map((step, i) => (
      <div key={step.id} className="flex items-center">
        <div className="flex items-center gap-2 px-5">
          <div
            className={`w-5 h-5 rounded-[10px] flex items-center justify-center border text-[10px] font-medium leading-none shrink-0 ${
              step.id === activeStep
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                : 'border-[#e4e2dc] text-[#7a7a72]'
            }`}
          >
            {step.id}
          </div>
          <span
            className={`text-[12px] font-medium whitespace-nowrap ${
              step.id === activeStep ? 'text-[#1a1a1a]' : 'text-[#7a7a72]'
            }`}
          >
            {step.label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <RiArrowRightSLine size={16} className="text-[#e4e2dc] shrink-0" aria-hidden />
        )}
      </div>
    ))}
  </div>
);

export default FormBuilderStepBar;

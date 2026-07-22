import { useNavigate } from 'react-router-dom';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import OnboardingStepBar from './OnboardingStepBar';

const OnboardingTopbar = ({
  activeStep = 1,
  onBack,
  onContinue,
  continueLabel = 'continue →',
  continueDisabled = false,
  showBack = true,
}) => {
  const navigate = useNavigate();

  return (
    <header className="h-12 shrink-0 bg-white border-b border-[#e4e2dc] flex items-center justify-between px-6">
      <button
        type="button"
        onClick={() => navigate('/onboarding')}
        className="flex items-center h-[30px] cursor-pointer"
        aria-label="Clearform home"
      >
        <img src={clearformLogo} alt="Clearform" className="h-[26px] w-auto object-contain" />
      </button>

      <OnboardingStepBar activeStep={activeStep} />

      <div className="flex items-center gap-2 shrink-0">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-[15px] rounded-lg border border-[#e4e2dc] bg-white text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled}
          className="h-8 px-[15px] rounded-lg bg-[#1a1a1a] border border-[#1a1a1a] text-[12px] font-medium text-white hover:bg-[#2c2c2e] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {continueLabel}
        </button>
      </div>
    </header>
  );
};

export default OnboardingTopbar;

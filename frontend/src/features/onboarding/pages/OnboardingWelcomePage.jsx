import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiLayoutGridLine } from 'react-icons/ri';
import {
  completeOnboarding,
  selectOnboardingStep,
  setOnboardingStep,
} from '@/store/slices/onboardingSlice';
import OnboardingBrandPanel from '../components/OnboardingBrandPanel';
import OnboardingWelcomeOptionCard from '../components/OnboardingWelcomeOptionCard';

const OnboardingWelcomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const step = useSelector(selectOnboardingStep);

  useEffect(() => {
    if (step >= 1) {
      navigate('/onboarding/templates', { replace: true });
    }
  }, [step, navigate]);

  const handleCreateFirstForm = () => {
    dispatch(setOnboardingStep(1));
    navigate('/onboarding/templates');
  };

  const handleGoToDashboard = () => {
    dispatch(completeOnboarding());
    navigate('/dashboard', { replace: true });
  };

  return (
    <div
      className="flex h-full min-h-0 w-full overflow-hidden bg-[#f5f4f1]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <aside className="hidden h-full w-[min(480px,36vw)] shrink-0 p-0 lg:block">
        <OnboardingBrandPanel />
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-[92px] lg:py-16">
          <div className="mb-9 flex flex-col gap-[9px]">
            <p className="text-[12px] font-medium uppercase tracking-[1.2px] text-[#e8000d]">
              YOU&apos;RE IN
            </p>
            <h1 className="text-[36px] font-bold leading-[39.6px] tracking-[-1px] text-[#0a0a0a]">
              What would you like
              <br />
              to do first?
            </h1>
            <p className="max-w-[520px] pt-[0.7px] text-[15px] leading-6 text-[#6b6965]">
              Create your first form now, or explore your dashboard — you can always build later.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
            <OnboardingWelcomeOptionCard
              variant="primary"
              badge="RECOMMENDED"
              icon={RiAddLine}
              title="Create my first form"
              description="Start from a template or blank canvas. Go live in minutes with AI-assisted fields."
              ctaLabel="Get started"
              onClick={handleCreateFirstForm}
            />
            <OnboardingWelcomeOptionCard
              variant="secondary"
              icon={RiLayoutGridLine}
              title="Skip for now — go to my dashboard"
              description="View all your forms, responses, and settings"
              ctaLabel="dashboard"
              onClick={handleGoToDashboard}
            />
          </div>
        </div>

        <div className="lg:hidden px-6 pb-8">
          <div className="h-[280px] overflow-hidden rounded-[20px]">
            <OnboardingBrandPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingWelcomePage;

import { Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsOnboardingActive } from '@/store/slices/onboardingSlice';
import {
  isPilotPlanIntent,
  PILOT_BILLING_PATH,
} from '@/features/billing/utils/pilotBillingRoutes';

const GuestOnly = ({ children }) => {
  const { isAuthenticated, isInitialized } = useSelector((s) => s.auth);
  const isOnboardingActive = useSelector(selectIsOnboardingActive);
  const [searchParams] = useSearchParams();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#e4e4e7] border-t-[#18181b] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (isPilotPlanIntent(searchParams)) {
      return <Navigate to={PILOT_BILLING_PATH} replace />;
    }
    if (isOnboardingActive) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestOnly;

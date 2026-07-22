import { Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsOnboardingActive } from '@/store/slices/onboardingSlice';
import {
  isPilotPlanIntent,
  PILOT_BILLING_PATH,
} from '@/features/billing/utils/pilotBillingRoutes';

const GuestOnly = ({ children }) => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const isOnboardingActive = useSelector(selectIsOnboardingActive);
  const [searchParams] = useSearchParams();

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

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsOnboardingActive } from '@/store/slices/onboardingSlice';

const GuestOnly = ({ children }) => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const isOnboardingActive = useSelector(selectIsOnboardingActive);

  if (isAuthenticated) {
    if (isOnboardingActive) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestOnly;

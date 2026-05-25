import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsOnboardingActive,
  resumeOnboardingIfNeeded,
  enterOnboardingFlow,
} from '@/store/slices/onboardingSlice';

const OnboardingLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = useSelector(selectIsOnboardingActive);
  const completed = useSelector((s) => s.onboarding.completed);
  const onOnboardingRoute = location.pathname.startsWith('/onboarding');

  useEffect(() => {
    dispatch(resumeOnboardingIfNeeded());
    if (!completed) {
      dispatch(enterOnboardingFlow());
    }
  }, [dispatch, completed]);

  useEffect(() => {
    if (!onOnboardingRoute) return;

    if (completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (!isActive && !completed) {
      navigate('/signin', { replace: true });
    }
  }, [completed, isActive, navigate, onOnboardingRoute]);

  if (completed) return null;
  if (!isActive) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f4f0]">
      <Outlet />
    </div>
  );
};

export default OnboardingLayout;

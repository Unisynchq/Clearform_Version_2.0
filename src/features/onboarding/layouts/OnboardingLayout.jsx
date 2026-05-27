import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import {
  getOnboardingSlideDirection,
  onboardingPageTransition,
  onboardingPageVariants,
} from '@/constants/onboardingTransitions';
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

  const prevPathRef = useRef(location.pathname);
  const slideDirectionRef = useRef(0);

  if (location.pathname !== prevPathRef.current) {
    slideDirectionRef.current = getOnboardingSlideDirection(
      prevPathRef.current,
      location.pathname,
    );
  }

  useLayoutEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

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
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f4f1]">
      <AnimatePresence mode="wait" initial={false} custom={slideDirectionRef.current}>
        <motion.div
          key={location.pathname}
          custom={slideDirectionRef.current}
          variants={onboardingPageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={onboardingPageTransition}
          className="flex h-full min-h-0 w-full flex-col will-change-transform"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingLayout;

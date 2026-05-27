import { motion } from 'motion/react';
import {
  BUILDER_ROUTE_ENTER,
  BUILDER_ROUTE_EXIT,
  DASHBOARD_ROUTE_EXIT,
} from '@/constants/routeTransitions';
import { premiumTransition } from '@/constants/premiumTransition';
import { DASHBOARD_ROUTE_ENTER, DASHBOARD_ROUTE_INITIAL } from '@/motion/dashboardMotion';

const SHELL_CLASS = {
  dashboard: 'h-screen w-full overflow-visible',
  default: 'h-screen w-full overflow-hidden',
};

const VARIANTS = {
  dashboard: {
    initial: DASHBOARD_ROUTE_INITIAL,
    animate: DASHBOARD_ROUTE_ENTER,
    exit: DASHBOARD_ROUTE_EXIT,
  },
  'form-builder': {
    initial: { opacity: 0 },
    animate: BUILDER_ROUTE_ENTER,
    exit: BUILDER_ROUTE_EXIT,
  },
  onboarding: {
    initial: { opacity: 0, scale: 0.985 },
    animate: { opacity: 1, scale: 1, transition: premiumTransition },
    exit: { opacity: 0, scale: 0.985, transition: premiumTransition },
  },
  auth: {
    initial: { opacity: 0, scale: 0.99 },
    animate: { opacity: 1, scale: 1, transition: premiumTransition },
    exit: { opacity: 0, scale: 0.99, transition: premiumTransition },
  },
};

const RouteTransitionShell = ({ variant = 'auth', className = '', children }) => {
  const v = VARIANTS[variant] ?? VARIANTS.auth;
  const shellClass = SHELL_CLASS[variant] ?? SHELL_CLASS.default;

  return (
    <motion.div
      className={`${shellClass} ${className}`.trim()}
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
    >
      {children}
    </motion.div>
  );
};

export default RouteTransitionShell;

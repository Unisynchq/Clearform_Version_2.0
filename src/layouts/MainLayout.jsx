import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import { DASHBOARD_ROUTE_EXIT } from '@/constants/routeTransitions';
import {
  dashboardPushBackActive,
  dashboardPushBackIdle,
  premiumTransition,
} from '@/constants/premiumTransition';
import { selectIsGlobalOverlayActive } from '@/store/selectors/globalOverlaySelectors';
import Sidebar from '@/components/layout/Sidebar';
import RouteErrorBoundary from '@/components/errors/RouteErrorBoundary';
import { DashboardErrorFallback } from '@/components/errors/RouteErrorFallbacks';
import useSystemNotificationsSync from '@/hooks/useSystemNotificationsSync';

const MainLayout = () => {
  const location = useLocation();
  const isGlobalOverlayActive = useSelector(selectIsGlobalOverlayActive);
  const isTemplatesRoute = location.pathname.startsWith('/dashboard/templates');
  useSystemNotificationsSync();

  return (
    <div className="flex h-full min-h-0 w-full">
    <motion.div
      className="flex h-full min-h-0 w-full origin-center"
      initial={dashboardPushBackIdle}
      animate={isGlobalOverlayActive ? dashboardPushBackActive : dashboardPushBackIdle}
      transition={premiumTransition}
    >
      <AnimatePresence initial={false}>
        <Sidebar key="dashboard-sidebar" exit={DASHBOARD_ROUTE_EXIT} />
      </AnimatePresence>
      <main className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <div
          className={`flex h-full min-h-0 flex-col overflow-y-auto${
            isTemplatesRoute ? ' bg-white' : ''
          }`}
        >
          <RouteErrorBoundary
            fallback={DashboardErrorFallback}
            resetKey={location.pathname}
          >
            <Outlet />
          </RouteErrorBoundary>
        </div>
      </main>
    </motion.div>
    </div>
  );
};

export default MainLayout;

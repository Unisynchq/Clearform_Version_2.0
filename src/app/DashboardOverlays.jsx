import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import GlobalOverlayHost from '@/app/GlobalOverlayHost';

/**
 * Dashboard form overlays (share, delete, compare, etc.) must not mount on guest
 * routes — a render error there showed "A dialog failed to load" on /signin.
 */
const DashboardOverlays = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { pathname } = useLocation();

  const needsOverlays =
    isAuthenticated ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding');

  if (!needsOverlays) return null;

  return <GlobalOverlayHost />;
};

export default DashboardOverlays;

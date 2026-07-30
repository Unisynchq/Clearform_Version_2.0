import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from '@/routes/AppRoutes';
import ToastContainer from '@/components/feedback/ToastContainer';
import DashboardOverlays from '@/app/DashboardOverlays';
import CreateNewFormModal from '@/features/forms/components/CreateNewFormModal';
import NotificationCenter from '@/features/forms/components/NotificationCenter';
import BuilderRouteTransitionOverlay from '@/components/layout/BuilderRouteTransitionOverlay';
import AuthRedirectHandler from '@/features/auth/components/AuthRedirectHandler';
import SupabaseSessionBridge from '@/features/auth/components/SupabaseSessionBridge';
import SupabaseOAuthCallback from '@/features/auth/components/SupabaseOAuthCallback';
import { capturePendingPaymentFromUrl } from '@/features/billing/utils/pendingPaymentStorage';
import { captureAndClaimPendingPurchase } from '@/features/billing/utils/billingReturnFlow';
import { loadFormsFromApi, loadWorkspacesFromApi } from '@/store/slices/formsSlice';
import { loadNotificationsFromApi } from '@/store/slices/notificationsSlice';
import { useToast } from '@/hooks/useToast';
import { isApiConfigured } from '@/config/env';

const App = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    capturePendingPaymentFromUrl();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadFormsFromApi());
      dispatch(loadWorkspacesFromApi());
      dispatch(loadNotificationsFromApi());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !isApiConfigured()) return;
    void captureAndClaimPendingPurchase({ showToast });
  }, [isAuthenticated, showToast]);

  return (
    <BrowserRouter>
      {isOAuthPopupWindow() ? <SupabaseOAuthCallback /> : <AppShell />}
    </BrowserRouter>
  );
};

/**
 * True only inside the small window we opened via `window.open(url,
 * 'clearform-oauth', ...)` for Google/Microsoft sign-in. Checked by window
 * identity (name + opener), NOT by URL path — if the OAuth redirect ever
 * lands somewhere other than /auth/callback (e.g. a redirect URL missing
 * from the Supabase allow-list), this still stops the full app/dashboard
 * from rendering inside that small popup instead of the intended account
 * picker → close-and-hand-off flow.
 */
function isOAuthPopupWindow() {
  if (typeof window === 'undefined') return false;
  try {
    return window.name === 'clearform-oauth' && Boolean(window.opener);
  } catch {
    return false;
  }
}

// Auth-popup routes (the Supabase OAuth callback window) must not mount the
// main app's session bridge/redirect handler — that window's only job is to
// hand its session back to the opener via localStorage and close itself.
const AppShell = () => {
  const location = useLocation();
  const pathname = location.pathname ?? '';
  const isAuthPopupRoute = pathname.startsWith('/auth/');

  return (
    <>
      {!isAuthPopupRoute ? (
        <>
          <AuthRedirectHandler />
          <SupabaseSessionBridge />
        </>
      ) : null}
      <AppRoutes />
      <ToastContainer />
      <DashboardOverlays />
      <CreateNewFormModal />
      <NotificationCenter />
      <BuilderRouteTransitionOverlay />
    </>
  );
};

export default App;

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
import { capturePendingPaymentFromUrl } from '@/features/billing/utils/pendingPaymentStorage';
import { captureAndClaimPendingPurchase } from '@/features/billing/utils/billingReturnFlow';
import { loadFormsFromApi, loadWorkspacesFromApi } from '@/store/slices/formsSlice';
import { loadNotificationsFromApi } from '@/store/slices/notificationsSlice';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useToast } from '@/hooks/useToast';
import { isApiConfigured } from '@/config/env';

const App = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isInitialized = useSelector((state) => state.auth.isInitialized);
  useRealtimeNotifications();

  useEffect(() => {
    capturePendingPaymentFromUrl();
  }, []);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    dispatch(loadFormsFromApi());
    dispatch(loadWorkspacesFromApi());
    dispatch(loadNotificationsFromApi());
  }, [isInitialized, isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !isApiConfigured()) return;
    void captureAndClaimPendingPurchase({ showToast });
  }, [isInitialized, isAuthenticated, showToast]);

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
};

const AppShell = () => {
  const location = useLocation();
  const pathname = location.pathname ?? '';
  // OAuth popup/callback + password recovery must own their own session exchange.
  const skipAuthBootHandlers =
    pathname.startsWith('/auth/') || pathname === '/reset-password';

  return (
    <>
      {!skipAuthBootHandlers ? (
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

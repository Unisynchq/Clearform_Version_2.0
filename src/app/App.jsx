import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from '@/routes/AppRoutes';
import ToastContainer from '@/components/feedback/ToastContainer';
import DashboardOverlays from '@/app/DashboardOverlays';
import CreateNewFormModal from '@/features/forms/components/CreateNewFormModal';
import NotificationCenter from '@/features/forms/components/NotificationCenter';
import BuilderRouteTransitionOverlay from '@/components/layout/BuilderRouteTransitionOverlay';
import AuthRedirectHandler from '@/features/auth/components/AuthRedirectHandler';
import FirebaseSessionBridge from '@/features/auth/components/FirebaseSessionBridge';
import { loadFormsFromApi, loadWorkspacesFromApi } from '@/store/slices/formsSlice';
import { loadNotificationsFromApi } from '@/store/slices/notificationsSlice';

const App = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadFormsFromApi());
      dispatch(loadWorkspacesFromApi());
      dispatch(loadNotificationsFromApi());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <BrowserRouter>
      <AuthRedirectHandler />
      <FirebaseSessionBridge />
      <AppRoutes />
      <ToastContainer />
      <DashboardOverlays />
      <CreateNewFormModal />
      <NotificationCenter />
      <BuilderRouteTransitionOverlay />
    </BrowserRouter>
  );
};

export default App;

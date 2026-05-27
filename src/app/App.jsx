import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import ToastContainer from '@/components/feedback/ToastContainer';
import GlobalOverlayHost from '@/app/GlobalOverlayHost';
import CreateNewFormModal from '@/features/forms/components/CreateNewFormModal';
import NotificationCenter from '@/features/forms/components/NotificationCenter';
import BuilderRouteTransitionOverlay from '@/components/layout/BuilderRouteTransitionOverlay';

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
      <GlobalOverlayHost />
      <CreateNewFormModal />
      <NotificationCenter />
      <BuilderRouteTransitionOverlay />
    </BrowserRouter>
  );
};

export default App;

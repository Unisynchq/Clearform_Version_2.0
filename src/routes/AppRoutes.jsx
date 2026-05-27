import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import OnboardingPage from "@/features/auth/pages/SignupPage";
import AllFormsPage from '../pages/AllFormsPage';
import ProfilePage from '../features/profile/pages/ProfilePage';
import AnalyticsPage from '../pages/AnalyticsPage';
import TemplatesPage from '../features/templates/pages/TemplatesPage';
import HelpSupportPage from '../features/support/pages/HelpSupportPage';
import FormBuilderPage from '../features/forms/pages/FormBuilderPage';
import PublicFormPage from '../features/forms/pages/PublicFormPage';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public form viewer — no auth required */}
      <Route path="/f/:formId" element={<PublicFormPage />} />

      {/* Landing / Signup page */}
      <Route path="/" element={<PublicRoute><OnboardingPage /></PublicRoute>} />

      {/* App dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<AllFormsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="help" element={<HelpSupportPage />} />
        <Route path="form-builder/:formId" element={<FormBuilderPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

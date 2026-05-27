import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import OnboardingPage from '../pages/OnboardingPage';
import AllFormsPage from '../pages/AllFormsPage';

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
      {/* Landing / Signup page */}
      <Route path="/" element={<PublicRoute><OnboardingPage /></PublicRoute>} />

      {/* App dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<AllFormsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

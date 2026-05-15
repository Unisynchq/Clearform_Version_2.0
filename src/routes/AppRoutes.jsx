import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SignupPage from '../pages/SignupPage';
import SignInPage from '../pages/SignInPage';
import AllFormsPage from '../pages/AllFormsPage';
import TemplatesPage from '../pages/TemplatesPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ProfilePage from '../pages/ProfilePage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing / Signup page */}
      <Route path="/" element={<SignupPage />} />

      {/* Sign in page */}
      <Route path="/signin" element={<SignInPage />} />

      {/* App dashboard */}
      <Route path="/dashboard" element={<MainLayout />}>
        <Route index element={<AllFormsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import SignupPage from '@/features/auth/pages/SignupPage';
import SignInPage from '@/features/auth/pages/SignInPage';
import AllFormsPage from '@/features/forms/pages/AllFormsPage';
import TemplatesPage from '@/features/templates/pages/TemplatesPage';
import FormBuilderPage from '@/features/forms/pages/FormBuilderPage';
import HelpSupportPage from '@/features/support/pages/HelpSupportPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import OnboardingLayout from '@/features/onboarding/layouts/OnboardingLayout';
import OnboardingChooseTemplatePage from '@/features/onboarding/pages/OnboardingChooseTemplatePage';
import RequireAuth from './RequireAuth';
import GuestOnly from './GuestOnly';

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestOnly>
            <SignupPage />
          </GuestOnly>
        }
      />

      <Route
        path="/signin"
        element={
          <GuestOnly>
            <SignInPage />
          </GuestOnly>
        }
      />

      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OnboardingChooseTemplatePage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AllFormsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="help" element={<HelpSupportPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/dashboard/form-builder"
        element={
          <RequireAuth>
            <FormBuilderPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

export default AppRoutes;

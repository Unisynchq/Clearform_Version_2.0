import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { getRouteTransitionKey } from '@/constants/routeTransitions';
import RouteTransitionShell from '@/components/layout/RouteTransitionShell';
import MainLayout from '@/layouts/MainLayout';
import SignupPage from '@/features/auth/pages/SignupPage';
import SignInPage from '@/features/auth/pages/SignInPage';
import AllFormsPage from '@/features/forms/pages/AllFormsPage';
import TemplatesPage from '@/features/templates/pages/TemplatesPage';
import FormBuilderPageShell from '@/features/forms/pages/FormBuilderPageShell';
import LegacyFormBuilderRedirect from '@/routes/LegacyFormBuilderRedirect';
const PublicFormPage = lazy(() => import('@/features/forms/pages/PublicFormPage'));
import RouteErrorBoundary from '@/components/errors/RouteErrorBoundary';
import {
  DashboardErrorFallback,
  PublicFormErrorFallback,
} from '@/components/errors/RouteErrorFallbacks';
import HelpSupportPage from '@/features/support/pages/HelpSupportPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import OnboardingLayout from '@/features/onboarding/layouts/OnboardingLayout';
import OnboardingWelcomePage from '@/features/onboarding/pages/OnboardingWelcomePage';
import OnboardingChooseTemplatePage from '@/features/onboarding/pages/OnboardingChooseTemplatePage';
import NotFoundPage from '@/pages/NotFoundPage';
import RequireAuth from './RequireAuth';
import GuestOnly from './GuestOnly';
import PageTitle from '@/components/layout/PageTitle';

const AppRoutes = () => {
  const location = useLocation();
  const transitionKey = getRouteTransitionKey(location.pathname);

  return (
    <>
    <PageTitle />
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={transitionKey}>
        <Route
          path="/"
          element={
            <RouteTransitionShell variant="auth">
              <GuestOnly>
                <SignupPage />
              </GuestOnly>
            </RouteTransitionShell>
          }
        />

        <Route
          path="/signin"
          element={
            <RouteTransitionShell variant="auth">
              <GuestOnly>
                <SignInPage />
              </GuestOnly>
            </RouteTransitionShell>
          }
        />

        <Route
          path="/onboarding"
          element={
            <RouteTransitionShell variant="onboarding">
              <RequireAuth>
                <OnboardingLayout />
              </RequireAuth>
            </RouteTransitionShell>
          }
        >
          <Route index element={<OnboardingWelcomePage />} />
          <Route path="templates" element={<OnboardingChooseTemplatePage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <RouteTransitionShell variant="dashboard" className="bg-[#f4f3ef]">
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            </RouteTransitionShell>
          }
        >
          <Route
            index
            element={
              <RouteErrorBoundary fallback={DashboardErrorFallback}>
                <AllFormsPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="templates"
            element={
              <RouteErrorBoundary fallback={DashboardErrorFallback}>
                <TemplatesPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="analytics"
            element={
              <RouteErrorBoundary fallback={DashboardErrorFallback}>
                <AnalyticsPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="help"
            element={
              <RouteErrorBoundary fallback={DashboardErrorFallback}>
                <HelpSupportPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="profile"
            element={
              <RouteErrorBoundary fallback={DashboardErrorFallback}>
                <ProfilePage />
              </RouteErrorBoundary>
            }
          />
        </Route>

        <Route
          path="/dashboard/form-builder/:formId"
          element={
            <RouteTransitionShell variant="form-builder">
              <RequireAuth>
                <FormBuilderPageShell />
              </RequireAuth>
            </RouteTransitionShell>
          }
        />

        <Route
          path="/dashboard/form-builder"
          element={
            <RouteTransitionShell variant="form-builder">
              <RequireAuth>
                <LegacyFormBuilderRedirect />
              </RequireAuth>
            </RouteTransitionShell>
          }
        />

        <Route
          path="/f/:formId"
          element={
            <RouteTransitionShell variant="auth">
              <RouteErrorBoundary fallback={PublicFormErrorFallback}>
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-[#e4e4e7] border-t-[#18181b] animate-spin" />
                      <p className="text-[14px] text-[#71717a]">Loading form…</p>
                    </div>
                  }
                >
                  <PublicFormPage />
                </Suspense>
              </RouteErrorBoundary>
            </RouteTransitionShell>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
    </>
  );
};

export default AppRoutes;

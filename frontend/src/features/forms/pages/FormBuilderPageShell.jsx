import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import RouteErrorBoundary from '@/components/errors/RouteErrorBoundary';
import { BuilderErrorFallback } from '@/components/errors/RouteErrorFallbacks';
import FormBuilderLoadingFallback from '@/features/forms/pages/FormBuilderLoadingFallback';

const FormBuilderPage = lazy(() => import('@/features/forms/pages/FormBuilderPage'));

/**
 * Production shell: route-scoped error boundary + code-split builder bundle.
 */
const FormBuilderPageShell = () => {
  const { formId } = useParams();
  return (
    <RouteErrorBoundary
      fallback={BuilderErrorFallback}
      resetKey={formId ?? 'new'}
    >
      <Suspense fallback={<FormBuilderLoadingFallback />}>
        <FormBuilderPage />
      </Suspense>
    </RouteErrorBoundary>
  );
};

export default FormBuilderPageShell;

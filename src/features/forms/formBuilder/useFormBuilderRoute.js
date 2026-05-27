import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { parseFormBuilderRouteId } from '@/features/forms/utils/formBuilderNavigation';

/**
 * Resolves builder form identity from URL (:formId) with location.state fallback for legacy links.
 */
export function useFormBuilderRoute() {
  const { formId: formIdParam } = useParams();
  const location = useLocation();
  const routeFormId = parseFormBuilderRouteId(formIdParam);
  const stateFormId = location.state?.formId ?? null;

  const activeFormId = routeFormId ?? stateFormId ?? null;

  const navigationMeta = useMemo(
    () => ({
      formTitle: location.state?.formTitle ?? null,
      templateId: location.state?.templateId ?? null,
      startInPreview: location.state?.startInPreview === true,
      fromOnboarding: location.state?.fromOnboarding === true,
      formColor: location.state?.formColor ?? null,
    }),
    [location.state],
  );

  const sessionKey = useMemo(
    () =>
      `${location.key}|${activeFormId ?? 'new'}|${navigationMeta.templateId ?? ''}`,
    [location.key, activeFormId, navigationMeta.templateId],
  );

  return {
    activeFormId,
    routeFormId,
    navigationMeta,
    location,
    sessionKey,
  };
}

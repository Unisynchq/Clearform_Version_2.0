import { BUILDER_NAV_MIN_MS } from '@/constants/routeTransitions';
import { startBuilderRouteTransition } from '@/store/slices/uiSlice';
import { getFormBuilderPath } from './formBuilderNavigation';

/**
 * Navigate to the form builder with a loading bridge and minimum transition time
 * so the dashboard can exit before the builder mounts.
 */
export function navigateToFormBuilder(
  navigate,
  dispatch,
  state,
  { minDelayMs = BUILDER_NAV_MIN_MS, replace = false, showOverlay = true } = {},
) {
  if (showOverlay) {
    dispatch(startBuilderRouteTransition());
  }
  const startedAt = performance.now();

  requestAnimationFrame(() => {
    const remaining = Math.max(0, minDelayMs - (performance.now() - startedAt));
    window.setTimeout(() => {
      navigate(getFormBuilderPath(state?.formId), { state, replace });
    }, remaining);
  });
}

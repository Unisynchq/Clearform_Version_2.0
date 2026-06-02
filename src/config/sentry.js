import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry when VITE_SENTRY_DSN is set. No-op in local dev without DSN.
 * @returns {boolean} whether Sentry is active
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT ??
      import.meta.env.MODE ??
      'development',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });

  return true;
}

export { Sentry };

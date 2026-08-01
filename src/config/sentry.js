import * as Sentry from '@sentry/react';

const SERVICE = 'clearform-web';

/**
 * Release identifier for this build (`clearform-web@<sha>`), matching backend
 * `clearform-api@<sha>`. Vercel system vars need a VITE_ prefix to reach the bundle.
 */
function resolveRelease() {
  const explicit = import.meta.env.VITE_SENTRY_RELEASE?.trim();
  if (explicit) return explicit;

  const sha = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA?.trim();
  return sha ? `${SERVICE}@${sha.slice(0, 7)}` : undefined;
}

/**
 * Non-production VITE_VERCEL_ENV overrides VITE_SENTRY_ENVIRONMENT so preview
 * deploys never land in the production issue stream.
 */
function resolveEnvironment() {
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV?.trim();
  if (vercelEnv && vercelEnv !== 'production') return vercelEnv;

  return (
    import.meta.env.VITE_SENTRY_ENVIRONMENT ??
    vercelEnv ??
    import.meta.env.MODE ??
    'development'
  );
}

/**
 * Initialize Sentry when VITE_SENTRY_DSN is set. No-op in local dev without DSN.
 * @returns {boolean} whether Sentry is active
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return false;

  const release = resolveRelease();

  Sentry.init({
    dsn,
    environment: resolveEnvironment(),
    ...(release ? { release } : {}),
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    ignoreErrors: [
      'ResizeObserver loop completed with undelivered notifications',
      'ResizeObserver loop limit exceeded',
      'AbortError',
      'Non-Error promise rejection captured',
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],
    beforeSend(event) {
      event.tags = { ...event.tags, service: SERVICE };
      return event;
    },
  });

  return true;
}

export { Sentry };

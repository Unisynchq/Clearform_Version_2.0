import posthog from 'posthog-js';

let posthogReady = false;

/**
 * Initialize PostHog when VITE_POSTHOG_PROJECT_TOKEN is set. No-op locally without token.
 * @returns {boolean} whether PostHog is active
 */
export function initPosthog() {
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
  if (!token) return false;
  if (typeof window === 'undefined') return false;
  if (posthogReady) return true;

  const apiHost =
    import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';

  posthog.init(token, {
    api_host: apiHost,
    defaults: '2026-05-30',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    person_profiles: 'identified_only',
  });

  posthogReady = true;
  return true;
}

export function isPosthogEnabled() {
  return posthogReady;
}

export { posthog };

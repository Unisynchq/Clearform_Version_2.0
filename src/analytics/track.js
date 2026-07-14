import { isPosthogEnabled, posthog } from '@/config/posthog';

/**
 * Product analytics helpers for Clearform.
 * Safe no-ops when PostHog is not configured.
 */

function safeProps(props = {}) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return out;
}

export function trackEvent(eventName, properties = {}) {
  if (!isPosthogEnabled()) return;
  if (typeof eventName !== 'string' || !eventName.trim()) return;
  posthog.capture(eventName.trim(), safeProps(properties));
}

/**
 * Identify after auth + backend sync.
 * Prefer Nest user id when present so persons stay stable across providers.
 */
export function identifyUser(user = {}) {
  if (!isPosthogEnabled()) return;
  const distinctId =
    (typeof user.id === 'string' && user.id.trim()) ||
    (typeof user.uid === 'string' && user.uid.trim()) ||
    (typeof user.email === 'string' && user.email.trim()) ||
    '';
  if (!distinctId) return;

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  posthog.identify(
    distinctId,
    safeProps({
      email: user.email,
      name: name || undefined,
      first_name: user.firstName,
      last_name: user.lastName,
      plan_id: user.planId,
      ai_tier: user.aiTier,
    }),
  );
}

export function resetAnalytics() {
  if (!isPosthogEnabled()) return;
  posthog.reset();
}

export function trackSignup({ method, email }) {
  trackEvent('user_signed_up', safeProps({ method, email }));
}

export function trackSignIn({ method, email }) {
  trackEvent('user_signed_in', safeProps({ method, email }));
}

export function trackFormCreated({ formId }) {
  trackEvent('form_created', safeProps({ form_id: formId }));
}

export function trackPilotCheckoutStarted() {
  trackEvent('pilot_checkout_started');
}

export function trackPilotActivated({ source }) {
  trackEvent('pilot_activated', safeProps({ source }));
}

export function trackPromoRedeemed() {
  trackEvent('promo_redeemed');
}

export function trackBillingViewed({ planId, aiTier }) {
  trackEvent('billing_viewed', safeProps({ plan_id: planId, ai_tier: aiTier }));
}

export function trackAiFeatureUsed({ feature }) {
  trackEvent('ai_feature_used', safeProps({ feature }));
}

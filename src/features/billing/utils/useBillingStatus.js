import { useCallback, useEffect, useState } from 'react';
import { getStatus } from '@/api/services/billingService';
import { isApiConfigured } from '@/config/env';

/**
 * Shared billing-status store — one GET /billing/status serves every consumer
 * (billing panel, upgrade gates, AI teasers) instead of each fetching its own.
 */
const CACHE_TTL_MS = 30_000;
const FOCUS_REFETCH_MIN_MS = 5_000;

const store = {
  status: null,
  fetchedAt: 0,
  loading: false,
  error: null,
  inflight: null,
  listeners: new Set(),
};

function notify() {
  for (const listener of store.listeners) listener();
}

async function fetchBillingStatus({ force = false } = {}) {
  if (!isApiConfigured()) return null;
  const fresh = Date.now() - store.fetchedAt < CACHE_TTL_MS;
  if (!force && fresh && store.status) return store.status;
  if (store.inflight) return store.inflight;

  store.loading = true;
  store.error = null;
  notify();

  store.inflight = getStatus()
    .then((data) => {
      store.status = data;
      store.fetchedAt = Date.now();
      return data;
    })
    .catch((err) => {
      store.error = err?.message ?? 'Could not load billing status';
      throw err;
    })
    .finally(() => {
      store.loading = false;
      store.inflight = null;
      notify();
    });

  return store.inflight;
}

/** Force the next read to hit the API (e.g. after a purchase is claimed). */
export function invalidateBillingStatus() {
  store.fetchedAt = 0;
}

/**
 * Billing status with plan, usage, and `aiTier` ('free' | 'pro') from
 * GET /billing/status. Refetches on window focus (throttled).
 *
 * @returns {{ status: object|null, aiTier: 'free'|'pro', isPaid: boolean, loading: boolean, error: string|null, refresh: () => Promise<object|null> }}
 */
export function useBillingStatus() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    store.listeners.add(listener);
    fetchBillingStatus().catch(() => {});

    const onFocus = () => {
      if (Date.now() - store.fetchedAt < FOCUS_REFETCH_MIN_MS) return;
      fetchBillingStatus({ force: true }).catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      store.listeners.delete(listener);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const refresh = useCallback(() => {
    invalidateBillingStatus();
    return fetchBillingStatus({ force: true });
  }, []);

  const status = store.status;
  return {
    status,
    aiTier: status?.aiTier === 'pro' ? 'pro' : 'free',
    isPaid: status?.aiTier === 'pro',
    loading: store.loading,
    error: store.error,
    refresh,
  };
}

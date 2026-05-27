import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

/**
 * Analytics facade — UI currently uses in-app demo series.
 * Backend should return shapes documented in BACKEND_HANDOFF.md.
 */

export async function fetchPerformanceAnalytics(formId, { range } = {}) {
  if (!isApiConfigured()) {
    return { formId, range: range ?? 'all', source: 'client-demo' };
  }
  return apiClient(API_ENDPOINTS.analytics.performance(formId), {
    query: range ? { range } : undefined,
  });
}

export async function fetchFormResponses(formId, { range, page = 1 } = {}) {
  if (!isApiConfigured()) {
    return { formId, items: [], page, total: 0, source: 'client-demo' };
  }
  return apiClient(API_ENDPOINTS.analytics.responses(formId), {
    query: { range, page },
  });
}

export async function generateAiInsights(formId, { range } = {}) {
  if (!isApiConfigured()) {
    return { formId, insights: [], source: 'client-demo' };
  }
  return apiClient(API_ENDPOINTS.analytics.aiInsights(formId), {
    method: 'POST',
    body: { range },
  });
}

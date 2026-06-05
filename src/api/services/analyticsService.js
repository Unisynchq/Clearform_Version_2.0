import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

/** Analytics facade — returns empty payloads when the API is not configured. */

export async function fetchPerformanceAnalytics(formId, { range } = {}) {
  if (!isApiConfigured()) {
    return { formId, range: range ?? 'all' };
  }
  return apiClient(API_ENDPOINTS.analytics.performance(formId), {
    query: range ? { range } : undefined,
  });
}

export async function fetchFormResponses(formId, { range, page = 1 } = {}) {
  if (!isApiConfigured()) {
    return { formId, items: [], page, total: 0 };
  }
  return apiClient(API_ENDPOINTS.analytics.responses(formId), {
    query: { range, page },
  });
}

export async function generateAiInsights(formId, { range } = {}) {
  if (!isApiConfigured()) {
    return { formId, insights: [] };
  }
  return apiClient(API_ENDPOINTS.analytics.aiInsights(formId), {
    method: 'POST',
    body: { range },
  });
}

export async function fetchCompareAnalytics(formId, { range } = {}) {
  if (!isApiConfigured()) {
    return { formId, range: range ?? 'all' };
  }
  return apiClient(API_ENDPOINTS.analytics.compare(formId), {
    query: range ? { range } : undefined,
  });
}

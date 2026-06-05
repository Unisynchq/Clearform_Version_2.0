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

/** Form overlay Overview tab (handoff B.13). */
export async function fetchFormOverview(formId) {
  if (!isApiConfigured() || !formId) {
    return null;
  }
  return apiClient(API_ENDPOINTS.analytics.overview(formId));
}

/** Map B.13 overview API shape to FormOverlayModal fields. */
export function mapOverviewApiToUi(api) {
  if (!api) return null;
  const step = api.aiInsight?.actionableStep;
  return {
    responses: api.responsesCount,
    responseLimit: api.responseLimit,
    responsesPercentage: api.responsesPercentage,
    responsesNeeded: api.responsesNeeded,
    estDaysToTarget: api.estDaysToTarget,
    completionRate: api.performance?.completionRate?.value ?? null,
    avgDurationSeconds: api.performance?.avgDurationSeconds?.value ?? null,
    responsesTrendWeek: api.performance?.responses?.trendWeekPercent ?? null,
    completionTrendWeek:
      api.performance?.completionRate?.trendWeekPercent ?? null,
    avgDurationTrend: api.performance?.avgDurationSeconds?.trendLabel ?? null,
    liveSince: api.publishedAt ?? null,
    daysActive: api.daysActive ?? null,
    aiInsight: api.aiInsight
      ? {
          text: api.aiInsight.message,
          screenId: step?.screenId ?? api.aiInsight.screenId,
          action: step?.action ?? api.aiInsight.action,
          builderTab: step?.builderTab,
        }
      : null,
  };
}

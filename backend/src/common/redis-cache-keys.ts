/** Redis key prefixes and TTLs (CLE-13). */
export const REDIS_KEYS = {
  formRender: (formId: string) => `form:render:${formId}`,
  formResponsesRecent: (formId: string) => `forms:${formId}:responses:recent`,
  analyticsInsights: (formId: string, range: string) =>
    `analytics:insights:v2:${formId}:${range}`,
  analyticsPerformance: (formId: string, range: string) =>
    `analytics:perf:v1:${formId}:${range}`,
  rateLimitAiInsights: (formId: string, tier: string) =>
    `ratelimit:ai-insights:${tier}:${formId}`,
  rateLimitLogicGenerate: (formId: string, tier: string) =>
    `ratelimit:logic-generate:${tier}:${formId}`,
  rateLimitResponseQuality: (formId: string, tier: string) =>
    `ratelimit:response-quality:${tier}:${formId}`,
  rateLimitResponseQualityOwnerPreview: (formId: string, userId: string) =>
    `ratelimit:response-quality:owner-preview:${formId}:${userId}`,
  rateLimitImproveInstructions: (formId: string, tier: string) =>
    `ratelimit:improve-instructions:${tier}:${formId}`,
  rateLimitOverview: (formId: string, tier: string) =>
    `ratelimit:overview:${tier}:${formId}`,
  analyticsOverview: (formId: string) => `analytics:overview:v1:${formId}`,
  aiDoctrineVersion: 'ai:doctrine:version',
  embeddingCache: (formId: string, contentHash: string) =>
    `ai:embed:${formId}:${contentHash}`,
  aiQualityEval: (formId: string, payloadHash: string) => `ai:quality:eval:${formId}:${payloadHash}`,
  aiLogic: (formId: string, snapshotHash: string) =>
    `ai:logic:v1:${formId}:${snapshotHash}`,
  aiTrialQualitySessions: (ownerUserId: string) =>
    `ai:trial:qsessions:${ownerUserId}`,
  aiQualitySession: (formId: string, sessionId: string) =>
    `ai:qsession:${formId}:${sessionId}`,
} as const;

export const REDIS_TTL = {
  formRenderSeconds: 1800,
  analyticsInsightsSeconds: 3_600,
  analyticsPerformanceSeconds: 900,
  formResponsesRecentSeconds: 3600,
  aiLogicSeconds: 604_800,
  aiQualityEvalSeconds: 300,
  embeddingCacheSeconds: 86_400,
  analyticsOverviewSeconds: 300,
  aiTrialQualitySessionsSeconds: 172_800,
  aiQualitySessionSeconds: 7_200,
} as const;

export const REDIS_LIMITS = {
  formResponsesRecentMax: 20,
} as const;

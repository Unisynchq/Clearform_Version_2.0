/**
 * REST path map — single source of truth for backend contract.
 * Base URL is prefixed by `apiClient` from `VITE_API_BASE_URL`.
 */
export const API_ENDPOINTS = {
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    signOut: '/auth/sign-out',
    me: '/auth/me',
  },
  forms: {
    list: '/forms',
    byId: (id) => `/forms/${id}`,
    publish: (id) => `/forms/${id}/publish`,
    unpublish: (id) => `/forms/${id}/unpublish`,
    duplicate: (id) => `/forms/${id}/duplicate`,
    archive: (id) => `/forms/${id}/archive`,
    builderSnapshot: (id) => `/forms/${id}/builder-snapshot`,
    published: (id) => `/forms/${id}/published`,
    shareLinks: (id) => `/forms/${id}/share-links`,
  },
  responses: {
    list: (formId) => `/forms/${formId}/responses`,
    create: (formId) => `/forms/${formId}/responses`,
    byId: (formId, responseId) => `/forms/${formId}/responses/${responseId}`,
    export: (formId) => `/forms/${formId}/responses/export`,
  },
  workspaces: {
    list: '/workspaces',
    byId: (id) => `/workspaces/${id}`,
  },
  templates: {
    list: '/templates',
    byId: (id) => `/templates/${id}`,
  },
  analytics: {
    performance: (formId) => `/analytics/forms/${formId}/performance`,
    responses: (formId) => `/analytics/forms/${formId}/responses`,
    compare: (formId) => `/analytics/forms/${formId}/compare`,
    aiInsights: (formId) => `/analytics/forms/${formId}/ai-insights`,
  },
  logic: {
    generate: (formId) => `/forms/${formId}/logic/generate`,
  },
  responseQuality: {
    evaluate: (formId) => `/forms/${formId}/response-quality/evaluate`,
    analytics: (formId) => `/analytics/forms/${formId}/response-quality`,
  },
  notifications: {
    list: '/notifications',
  },
  integrations: {
    workspaceList: (workspaceId) => `/workspaces/${workspaceId}/integrations`,
    workspaceConnect: (workspaceId, provider) =>
      `/workspaces/${workspaceId}/integrations/${provider}/connect`,
    formList: (formId) => `/forms/${formId}/integrations`,
  },
  webhooks: {
    list: (formId) => `/forms/${formId}/webhooks`,
    create: (formId) => `/forms/${formId}/webhooks`,
    update: (formId, webhookId) => `/forms/${formId}/webhooks/${webhookId}`,
    delete: (formId, webhookId) => `/forms/${formId}/webhooks/${webhookId}`,
    test: (formId, webhookId) => `/forms/${formId}/webhooks/${webhookId}/test`,
  },
};

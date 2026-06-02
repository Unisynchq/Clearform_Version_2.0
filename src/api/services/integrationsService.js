import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

/** Frontend integration keys → backend Composio provider slugs */
export const INTEGRATION_PROVIDER_SLUGS = {
  googleSheets: 'google_sheets',
  googleDrive: 'google_drive',
  slack: 'slack',
};

export function mapConnectionsToUiState(connections) {
  const activeByProvider = new Set(
    (connections ?? [])
      .filter((row) => row.active !== false)
      .map((row) => row.provider),
  );
  return {
    googleSheets: { connected: activeByProvider.has('google_sheets') },
    googleDrive: { connected: activeByProvider.has('google_drive') },
    slack: { connected: activeByProvider.has('slack') },
    webhook: { connected: false },
    notion: { connected: false },
  };
}

export async function listWorkspaceIntegrations(workspaceId) {
  if (!isApiConfigured() || !workspaceId) return [];
  return apiClient(API_ENDPOINTS.integrations.workspaceList(workspaceId));
}

export async function listFormIntegrations(formId) {
  if (!isApiConfigured() || !formId) return [];
  return apiClient(API_ENDPOINTS.integrations.formList(formId));
}

/** Returns { redirectUrl } — caller should assign window.location.href */
export async function connectIntegration(workspaceId, feKey) {
  const provider = INTEGRATION_PROVIDER_SLUGS[feKey];
  if (!provider) throw new Error(`Unknown integration: ${feKey}`);
  return apiClient(API_ENDPOINTS.integrations.workspaceConnect(workspaceId, provider), {
    method: 'POST',
  });
}

export function redirectToOAuth(redirectUrl) {
  if (redirectUrl && typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }
}

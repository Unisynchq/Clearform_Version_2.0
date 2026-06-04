import { apiClient, ApiError } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { mergeIntegrations } from '@/features/profile/utils/profileIntegrationDefaults';

/** Frontend integration keys → backend Composio provider slugs */
export const INTEGRATION_PROVIDER_SLUGS = {
  googleSheets: 'google_sheets',
  googleDrive: 'google_drive',
  slack: 'slack',
};

const PROVIDER_TO_KEY = {
  google_sheets: 'googleSheets',
  google_drive: 'googleDrive',
  slack: 'slack',
};

function mapIntegrationError(error) {
  if (error instanceof ApiError && error.status === 401) {
    return new Error('Session expired — sign in again.');
  }
  if (error instanceof ApiError && error.status === 503) {
    return new Error(
      error.message ||
        'Integrations are not configured on the server. Contact support.',
    );
  }
  return error;
}

export function mapConnectionsToUiState(connections) {
  const base = mergeIntegrations({
    googleSheets: { connected: false },
    googleDrive: { connected: false },
    slack: { connected: false },
    webhook: { connected: false },
    notion: { connected: false },
  });

  for (const row of connections ?? []) {
    const key = PROVIDER_TO_KEY[row.provider];
    if (!key) continue;
    const active = row.active !== false;
    base[key] = {
      connected: active,
      connectionId: row.id,
      metadata: row.metadata ?? {},
    };
  }
  return base;
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
  try {
    return await apiClient(API_ENDPOINTS.integrations.workspaceConnect(workspaceId, provider), {
      method: 'POST',
    });
  } catch (error) {
    throw mapIntegrationError(error);
  }
}

export function redirectToOAuth(redirectUrl) {
  if (redirectUrl && typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }
}

export async function disconnectIntegration(workspaceId, integrationId) {
  if (!isApiConfigured() || !workspaceId || !integrationId) {
    throw new Error('Disconnect requires workspace and integration id');
  }
  return apiClient(API_ENDPOINTS.integrations.workspaceById(workspaceId, integrationId), {
    method: 'DELETE',
  });
}

export async function patchIntegration(workspaceId, integrationId, body) {
  if (!isApiConfigured() || !workspaceId || !integrationId) {
    throw new Error('Patch requires workspace and integration id');
  }
  return apiClient(API_ENDPOINTS.integrations.workspaceById(workspaceId, integrationId), {
    method: 'PATCH',
    body,
  });
}

/** Save integration metadata via workspace or form-scoped PATCH. */
export async function saveIntegrationMetadata(
  workspaceId,
  formId,
  integrationId,
  metadata,
) {
  const body = { metadata };
  if (workspaceId) {
    return patchIntegration(workspaceId, integrationId, body);
  }
  if (formId) {
    return patchFormIntegration(formId, integrationId, body);
  }
  throw new Error('Workspace not found — reload the dashboard and try again.');
}

/** PATCH metadata via form scope when workspace id is unavailable in UI state. */
export async function patchFormIntegration(formId, integrationId, body) {
  if (!isApiConfigured() || !formId || !integrationId) {
    throw new Error('Patch requires form and integration id');
  }
  try {
    return await apiClient(API_ENDPOINTS.integrations.formList(formId), {
      method: 'PATCH',
      body: { integrationId, ...body },
    });
  } catch (error) {
    throw mapIntegrationError(error);
  }
}

/** Backfill existing form responses into the connected Google Sheet. */
export async function syncHistoricalToSheets(workspaceId, integrationId, formId) {
  if (!isApiConfigured() || !workspaceId || !integrationId || !formId) {
    throw new Error('Sync requires workspace, integration, and form id');
  }
  try {
    return await apiClient(
      API_ENDPOINTS.integrations.syncHistorical(workspaceId, integrationId),
      { method: 'POST', body: { formId } },
    );
  } catch (error) {
    throw mapIntegrationError(error);
  }
}

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
    const key = PROVIDER_TO_KEY[row.provider] ?? row.key;
    if (!key || !base[key]) continue;
    const active = row.active !== false;
    base[key] = {
      connected: active,
      connectionId: row.id ?? row.connectionId,
      metadata: { ...(base[key].metadata ?? {}), ...(row.metadata ?? {}) },
      health: row.health ?? null,
    };
  }
  return base;
}

const INTEGRATION_UI_KEYS = ['googleSheets', 'googleDrive', 'slack', 'webhook', 'notion'];

/** Workspace OAuth connections + per-form metadata merged for UI badges and config fields. */
export function mergeWorkspaceAndFormConnections(workspaceRows, formRows) {
  const workspace = mapConnectionsToUiState(workspaceRows);
  const form = mapConnectionsToUiState(formRows);
  const merged = mergeIntegrations(workspace);

  for (const key of INTEGRATION_UI_KEYS) {
    const w = workspace[key];
    const f = form[key];
    if (!w?.connected && !f?.connected && !f?.connectionId && !Object.keys(f?.metadata ?? {}).length) {
      continue;
    }
    merged[key] = {
      connected: Boolean(w?.connected || f?.connected),
      connectionId: w?.connectionId ?? f?.connectionId,
      metadata: { ...(w?.metadata ?? {}), ...(f?.metadata ?? {}) },
      health: w?.health ?? f?.health ?? null,
    };
  }
  return merged;
}

/** Load connected status from workspace API and form-scoped config from form integrations API. */
export async function loadIntegrationUiState({ workspaceId, formId } = {}) {
  if (!isApiConfigured()) {
    return mapConnectionsToUiState([]);
  }
  const [workspaceRows, formRows] = await Promise.all([
    workspaceId
      ? listWorkspaceIntegrations(workspaceId).catch(() => [])
      : Promise.resolve([]),
    formId ? listFormIntegrations(formId).catch(() => []) : Promise.resolve([]),
  ]);
  return mergeWorkspaceAndFormConnections(workspaceRows, formRows);
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

/** Write one test row to verify spreadsheet access (handoff B.9). */
export async function testSheetConnection(workspaceId, integrationId, formId) {
  if (!isApiConfigured() || !workspaceId || !integrationId) {
    throw new Error('Test requires workspace and integration id');
  }
  try {
    return await apiClient(
      API_ENDPOINTS.integrations.testSheet(workspaceId, integrationId),
      { method: 'POST', body: formId ? { formId } : {} },
    );
  } catch (error) {
    throw mapIntegrationError(error);
  }
}

/**
 * Creates a dedicated Google Sheet for a form via the backend and returns
 * { spreadsheetId, spreadsheetUrl }. The backend stores the spreadsheetId
 * into formSpreadsheetIds[formId] on the workspace's Google Sheets connection.
 */
export async function createFormSheet(formId) {
  if (!isApiConfigured() || !formId) {
    throw new Error('createFormSheet requires formId and API configured');
  }
  try {
    return await apiClient(API_ENDPOINTS.integrations.createFormSheet(formId), {
      method: 'POST',
    });
  } catch (error) {
    throw mapIntegrationError(error);
  }
}

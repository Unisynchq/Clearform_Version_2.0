import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { readWorkspaces } from '@/features/forms/utils/workspacesStorage';

function mapWorkspace(ws) {
  return {
    id: ws.id,
    label: ws.label,
    color: ws.color ?? ws.colour ?? null,
    count: ws.count ?? 0,
  };
}

export async function listWorkspaces() {
  if (isApiConfigured()) {
    const rows = await apiClient(API_ENDPOINTS.workspaces.list);
    return Array.isArray(rows) ? rows.map(mapWorkspace) : [];
  }
  return readWorkspaces() ?? [];
}

export async function createWorkspace({ label, color }) {
  if (isApiConfigured()) {
    const created = await apiClient(API_ENDPOINTS.workspaces.list, {
      method: 'POST',
      body: { label, colour: color },
    });
    return mapWorkspace(created);
  }
  const id = `ws-${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  return { id, label: label.trim(), color, count: 0 };
}

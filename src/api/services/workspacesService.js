import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { readWorkspaces, writeWorkspaces } from '@/features/forms/utils/workspacesStorage';

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
  const workspace = { id, label: label.trim(), color, count: 0 };
  const workspaces = readWorkspaces() ?? [];
  writeWorkspaces([...workspaces, workspace]);
  return workspace;
}

export async function updateWorkspace(id, { label, color }) {
  if (isApiConfigured() && !String(id).startsWith('ws-')) {
    const body = {};
    if (label?.trim()) body.label = label.trim();
    if (color) body.colour = color;
    const updated = await apiClient(API_ENDPOINTS.workspaces.byId(id), {
      method: 'PATCH',
      body,
    });
    return mapWorkspace(updated);
  }
  
  // Offline fallback
  const workspaces = readWorkspaces() ?? [];
  const updatedWorkspaces = workspaces.map((ws) => {
    if (ws.id === id) {
      return {
        ...ws,
        label: label?.trim() || ws.label,
        color: color || ws.color,
      };
    }
    return ws;
  });
  writeWorkspaces(updatedWorkspaces);
  return updatedWorkspaces.find((ws) => ws.id === id);
}

export async function deleteWorkspace(id) {
  if (isApiConfigured() && !String(id).startsWith('ws-')) {
    await apiClient(API_ENDPOINTS.workspaces.byId(id), {
      method: 'DELETE',
    });
    return;
  }
  
  // Offline fallback
  const workspaces = readWorkspaces() ?? [];
  const updatedWorkspaces = workspaces.filter((ws) => ws.id !== id);
  writeWorkspaces(updatedWorkspaces);
}

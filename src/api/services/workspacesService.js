import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

export async function listWorkspaces() {
  return apiClient(API_ENDPOINTS.workspaces.list);
}

export async function createWorkspace(data) {
  return apiClient(API_ENDPOINTS.workspaces.list, {
    method: 'POST',
    body: data,
  });
}

export async function updateWorkspace(id, data) {
  return apiClient(API_ENDPOINTS.workspaces.byId(id), {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteWorkspace(id) {
  return apiClient(API_ENDPOINTS.workspaces.byId(id), {
    method: 'DELETE',
  });
}

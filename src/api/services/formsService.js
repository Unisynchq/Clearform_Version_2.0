import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

export async function listForms() {
  return apiClient(API_ENDPOINTS.forms.list);
}

export async function getBuilderSnapshot(formId) {
  return apiClient(API_ENDPOINTS.forms.builderSnapshot(formId));
}

export async function saveBuilderSnapshot(formId, snapshot) {
  return apiClient(API_ENDPOINTS.forms.builderSnapshot(formId), {
    method: 'PUT',
    body: snapshot,
  });
}

export async function publishForm(formId) {
  return apiClient(API_ENDPOINTS.forms.publish(formId), {
    method: 'POST',
  });
}

export async function unpublishForm(formId) {
  return apiClient(API_ENDPOINTS.forms.unpublish(formId), {
    method: 'POST',
  });
}

export async function getPublishedForm(formId) {
  return apiClient(API_ENDPOINTS.forms.published(formId));
}

export async function createForm(data) {
  return apiClient(API_ENDPOINTS.forms.list, {
    method: 'POST',
    body: data,
  });
}

export async function updateForm(id, data) {
  return apiClient(API_ENDPOINTS.forms.byId(id), {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteForm(id) {
  return apiClient(API_ENDPOINTS.forms.byId(id), {
    method: 'DELETE',
  });
}

export async function archiveForm(id) {
  return apiClient(API_ENDPOINTS.forms.archive(id), {
    method: 'PATCH',
  });
}

export async function duplicateForm({ originalId, newTitle }) {
  return apiClient(API_ENDPOINTS.forms.duplicate(originalId), {
    method: 'POST',
    body: { title: newTitle },
  });
}

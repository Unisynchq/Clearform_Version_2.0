import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

export async function listFormWebhooks(formId) {
  if (!isApiConfigured() || !formId) return [];
  const rows = await apiClient(API_ENDPOINTS.webhooks.list(formId));
  return Array.isArray(rows) ? rows : [];
}

export async function createFormWebhook(formId, body) {
  return apiClient(API_ENDPOINTS.webhooks.create(formId), {
    method: 'POST',
    body,
  });
}

export async function updateFormWebhook(formId, webhookId, body) {
  return apiClient(API_ENDPOINTS.webhooks.update(formId, webhookId), {
    method: 'PATCH',
    body,
  });
}

export async function deleteFormWebhook(formId, webhookId) {
  return apiClient(API_ENDPOINTS.webhooks.delete(formId, webhookId), {
    method: 'DELETE',
  });
}

export async function testFormWebhook(formId, webhookId) {
  return apiClient(API_ENDPOINTS.webhooks.test(formId, webhookId), {
    method: 'POST',
  });
}

/** Build trigger list from share-modal checkbox state */
export function buildWebhookTriggers({ created, closed, updated }) {
  const triggers = [];
  if (created) triggers.push('response.created');
  if (closed) triggers.push('form.closed');
  if (updated) triggers.push('response.updated');
  return triggers.length ? triggers : ['response.created'];
}

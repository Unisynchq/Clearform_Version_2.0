import { apiClient } from '@/api/client';
import { isApiConfigured } from '@/config/env';

/** PATCH /forms/:formId/settings/response-limit */
export async function updateFormResponseLimit(formId, responseLimit) {
  if (!isApiConfigured() || formId == null) return null;
  return apiClient(`/forms/${formId}/settings/response-limit`, {
    method: 'PATCH',
    body: { responseLimit },
  });
}

/** PATCH /forms/:formId/settings/notifications */
export async function updateFormNotifications(formId, notificationsEnabled) {
  if (!isApiConfigured() || formId == null) return null;
  return apiClient(`/forms/${formId}/settings/notifications`, {
    method: 'PATCH',
    body: { notificationsEnabled },
  });
}

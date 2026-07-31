import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { isApiConfigured } from '@/config/env';

export async function listNotifications(page = 1) {
  return apiClient(`${API_ENDPOINTS.notifications.list}?page=${page}`);
}

export async function markNotificationReadOnServer(id) {
  if (!isApiConfigured()) return;
  return apiClient(API_ENDPOINTS.notifications.readOne(id), { method: 'PATCH' });
}

export async function markAllNotificationsReadOnServer() {
  if (!isApiConfigured()) return;
  return apiClient(API_ENDPOINTS.notifications.readAll, { method: 'PATCH' });
}

export async function deleteAllNotifications() {
  if (!isApiConfigured()) return;
  return apiClient(API_ENDPOINTS.notifications.deleteAll, { method: 'DELETE' });
}

export async function getUnreadCount() {
  if (!isApiConfigured()) return { count: 0 };
  return apiClient(API_ENDPOINTS.notifications.unreadCount);
}

export function getSseUrl() {
  return API_ENDPOINTS.notifications.stream;
}

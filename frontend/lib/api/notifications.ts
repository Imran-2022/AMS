import { request } from '@/lib/api';

export async function getNotifications(page = 1, pageSize = 10) {
  return request<any[]>(`/api/notifications?page=${page}&pageSize=${pageSize}`);
}

export async function getUnreadNotificationCount() {
  return request<number>(`/api/notifications/unread-count`);
}

export async function markNotificationRead(id: string) {
  return request<void>(`/api/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return request<void>(`/api/notifications/read-all`, { method: 'POST' });
}

export async function getNotificationPreferences() {
  return request<Array<{ type: string; isEnabled: boolean }>>(`/api/notifications/preferences`);
}

export async function updateNotificationPreference(type: string, isEnabled: boolean) {
  return request<{ type: string; isEnabled: boolean }>(`/api/notifications/preferences/${type}`, {
    method: 'PUT',
    body: JSON.stringify({ isEnabled }),
  });
}

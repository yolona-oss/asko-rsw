import { api } from './client';
import type { NotificationRecord, PaginatedNotifications, UnreadCount } from './types';
import type { INotificationPreferences } from '@asko/shared/client';

export interface NotificationPreferencesResponse {
  globalMute: boolean;
  groups: Array<{ group: string; in_app: boolean; push: boolean; email: boolean }>;
}

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  createdAt: string;
}

export const notificationApi = {
  list(params?: { page?: number; limit?: number; unreadOnly?: boolean; group?: string; readStatus?: string }) {
    return api.get<PaginatedNotifications>('/notifications', { params });
  },

  unreadCount() {
    return api.get<UnreadCount>('/notifications/unread-count', { _silent: true } as any);
  },

  markAsRead(id: string) {
    return api.post(`/notifications/${id}/read`, null, { _silent: true } as any);
  },

  markAllAsRead() {
    return api.post('/notifications/read-all');
  },

  delete(id: string) {
    return api.delete(`/notifications/${id}`);
  },

  // ─── Preferences ──────────────────────────────────────────────────

  async getPreferences() {
    const res = await api.get<NotificationPreferencesResponse>('/notifications/preferences');
    res.data.groups ??= [];
    return res;
  },

  async updatePreferences(data: {
    globalMute?: boolean;
    groups?: Array<{ group: string; in_app: boolean; push: boolean; email: boolean }>;
  }) {
    const res = await api.put<NotificationPreferencesResponse>('/notifications/preferences', data);
    res.data.groups ??= [];
    return res;
  },

  // ─── Push Subscriptions ───────────────────────────────────────────

  registerPushSubscription(data: { endpoint: string; p256dh: string; auth: string }) {
    return api.post<PushSubscriptionRecord>('/notifications/push-subscriptions', data);
  },

  unregisterPushSubscription(endpoint: string) {
    return api.delete('/notifications/push-subscriptions', { data: { endpoint } });
  },

  listPushSubscriptions() {
    return api.get<{ subscriptions: PushSubscriptionRecord[] }>('/notifications/push-subscriptions');
  },
};

export type { NotificationRecord, PaginatedNotifications, UnreadCount, INotificationPreferences };

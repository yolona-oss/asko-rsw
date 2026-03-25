import { api } from './client';
import type { NotificationRecord, PaginatedNotifications, UnreadCount } from './types';

export const notificationApi = {
  list(params?: { offset?: number; limit?: number; unreadOnly?: boolean }) {
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
};

export type { NotificationRecord, PaginatedNotifications, UnreadCount };

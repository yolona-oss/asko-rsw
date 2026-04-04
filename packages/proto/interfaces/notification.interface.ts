import { Observable } from 'rxjs';

// ─── Requests ───────────────────────────────────────────────────────────

export interface CreateNotificationRequest {
    userId: string;
    type: string;
    title: string;
    body: string;
    targetType: string;
    targetId: string;
    metadata: string;
}

export interface ListUserNotificationsRequest {
    userId: string;
    page: number;
    limit: number;
    unreadOnly: boolean;
    sortBy: string;
    sortOrder: string;
}

export interface MarkAsReadRequest {
    notificationId: string;
    userId: string;
}

export interface MarkAllAsReadRequest {
    userId: string;
}

export interface GetUnreadCountRequest {
    userId: string;
}

export interface DeleteNotificationRequest {
    notificationId: string;
    userId: string;
}

// ─── Responses ──────────────────────────────────────────────────────────

export interface EmptyNotificationResponse {}

export interface NotificationRecord {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    targetType: string;
    targetId: string;
    metadata: string;
    isRead: boolean;
    readAt: string;
    createdAt: string;
}

export interface NotificationResponse {
    notification: NotificationRecord;
}

export interface PaginatedNotificationsResponse {
    data: NotificationRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface UnreadCountResponse {
    count: number;
}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface NotificationServiceClient {
    createNotification(request: CreateNotificationRequest): Observable<NotificationResponse>;
    listUserNotifications(request: ListUserNotificationsRequest): Observable<PaginatedNotificationsResponse>;
    markAsRead(request: MarkAsReadRequest): Observable<EmptyNotificationResponse>;
    markAllAsRead(request: MarkAllAsReadRequest): Observable<EmptyNotificationResponse>;
    getUnreadCount(request: GetUnreadCountRequest): Observable<UnreadCountResponse>;
    deleteNotification(request: DeleteNotificationRequest): Observable<EmptyNotificationResponse>;
}

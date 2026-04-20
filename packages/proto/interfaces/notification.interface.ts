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
    urgency: string;
}

export interface ListUserNotificationsRequest {
    userId: string;
    page: number;
    limit: number;
    unreadOnly: boolean;
    sortBy: string;
    sortOrder: string;
    group: string;
    readStatus: string;
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
    urgency: string;
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

// ─── Preferences ──────────────────────────────────────────────────────

export interface GetPreferencesRequest {
    userId: string;
}

export interface GroupPreference {
    group: string;
    inApp: boolean;
    push: boolean;
    email: boolean;
}

export interface NotificationPreferencesResponse {
    globalMute: boolean;
    groups: GroupPreference[];
}

export interface UpdatePreferencesRequest {
    userId: string;
    globalMute: boolean;
    groups: GroupPreference[];
    hasGlobalMute: boolean;
}

// ─── Push Subscriptions ───────────────────────────────────────────────

export interface RegisterPushSubscriptionRequest {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string;
}

export interface PushSubscriptionResponse {
    id: string;
    endpoint: string;
    createdAt: string;
}

export interface UnregisterPushSubscriptionRequest {
    userId: string;
    endpoint: string;
}

export interface ListPushSubscriptionsRequest {
    userId: string;
}

export interface PushSubscriptionListResponse {
    subscriptions: PushSubscriptionResponse[];
}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface NotificationServiceClient {
    createNotification(request: CreateNotificationRequest): Observable<NotificationResponse>;
    listUserNotifications(request: ListUserNotificationsRequest): Observable<PaginatedNotificationsResponse>;
    markAsRead(request: MarkAsReadRequest): Observable<EmptyNotificationResponse>;
    markAllAsRead(request: MarkAllAsReadRequest): Observable<EmptyNotificationResponse>;
    getUnreadCount(request: GetUnreadCountRequest): Observable<UnreadCountResponse>;
    deleteNotification(request: DeleteNotificationRequest): Observable<EmptyNotificationResponse>;
    getNotificationPreferences(request: GetPreferencesRequest): Observable<NotificationPreferencesResponse>;
    updateNotificationPreferences(request: UpdatePreferencesRequest): Observable<NotificationPreferencesResponse>;
    registerPushSubscription(request: RegisterPushSubscriptionRequest): Observable<PushSubscriptionResponse>;
    unregisterPushSubscription(request: UnregisterPushSubscriptionRequest): Observable<EmptyNotificationResponse>;
    listPushSubscriptions(request: ListPushSubscriptionsRequest): Observable<PushSubscriptionListResponse>;
}

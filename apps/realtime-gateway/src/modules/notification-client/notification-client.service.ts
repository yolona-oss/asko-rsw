import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    NotificationServiceClient,
    NotificationResponse,
    PaginatedNotificationsResponse,
    UnreadCountResponse,
    EmptyNotificationResponse,
    NotificationPreferencesResponse,
    PushSubscriptionResponse,
    PushSubscriptionListResponse,
    GroupPreference,
} from '@asko/proto';

@Injectable()
export class NotificationClientService implements OnModuleInit {
    private notificationService!: NotificationServiceClient;

    constructor(
        @Inject('NOTIFICATION_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.notificationService = this.client.getService<NotificationServiceClient>('NotificationService');
    }

    // ─── Create ─────────────────────────────────────────────────────────

    createNotification(
        userId: string,
        type: string,
        title: string,
        body: string,
        targetType?: string,
        targetId?: string,
        metadata?: Record<string, any>,
        urgency?: string,
    ): Promise<NotificationResponse> {
        return grpcCall(this.notificationService.createNotification({
            userId,
            type,
            title,
            body,
            targetType: targetType ?? '',
            targetId: targetId ?? '',
            metadata: metadata ? JSON.stringify(metadata) : '',
            urgency: urgency ?? '',
        }));
    }

    // ─── Queries ────────────────────────────────────────────────────────

    async listUserNotifications(
        userId: string,
        page?: number,
        limit?: number,
        unreadOnly?: boolean,
        sortBy?: string,
        sortOrder?: string,
    ): Promise<PaginatedNotificationsResponse> {
        const res = await grpcCall(this.notificationService.listUserNotifications({
            userId,
            page: page ?? 0,
            limit: limit ?? 20,
            unreadOnly: unreadOnly ?? false,
            sortBy: sortBy ?? '',
            sortOrder: sortOrder ?? '',
        }));
        return { ...res, data: res.data ?? [] };
    }

    getUnreadCount(userId: string): Promise<UnreadCountResponse> {
        return grpcCall(this.notificationService.getUnreadCount({ userId }));
    }

    // ─── Actions ────────────────────────────────────────────────────────

    markAsRead(notificationId: string, userId: string): Promise<EmptyNotificationResponse> {
        return grpcCall(this.notificationService.markAsRead({ notificationId, userId }));
    }

    markAllAsRead(userId: string): Promise<EmptyNotificationResponse> {
        return grpcCall(this.notificationService.markAllAsRead({ userId }));
    }

    deleteNotification(notificationId: string, userId: string): Promise<EmptyNotificationResponse> {
        return grpcCall(this.notificationService.deleteNotification({ notificationId, userId }));
    }

    // ─── Preferences ────────────────────────────────────────────────────

    getNotificationPreferences(userId: string): Promise<NotificationPreferencesResponse> {
        return grpcCall(this.notificationService.getNotificationPreferences({ userId }));
    }

    updateNotificationPreferences(
        userId: string,
        globalMute: boolean | undefined,
        groups: GroupPreference[],
        hasGlobalMute: boolean,
    ): Promise<NotificationPreferencesResponse> {
        return grpcCall(this.notificationService.updateNotificationPreferences({
            userId,
            globalMute: globalMute ?? false,
            groups,
            hasGlobalMute,
        }));
    }

    // ─── Push Subscriptions ─────────────────────────────────────────────

    registerPushSubscription(
        userId: string,
        endpoint: string,
        p256dh: string,
        auth: string,
        userAgent?: string,
    ): Promise<PushSubscriptionResponse> {
        return grpcCall(this.notificationService.registerPushSubscription({
            userId,
            endpoint,
            p256dh,
            auth,
            userAgent: userAgent ?? '',
        }));
    }

    unregisterPushSubscription(userId: string, endpoint: string): Promise<EmptyNotificationResponse> {
        return grpcCall(this.notificationService.unregisterPushSubscription({ userId, endpoint }));
    }

    listPushSubscriptions(userId: string): Promise<PushSubscriptionListResponse> {
        return grpcCall(this.notificationService.listPushSubscriptions({ userId }));
    }
}

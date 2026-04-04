import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    NotificationServiceClient,
    NotificationResponse,
    PaginatedNotificationsResponse,
    UnreadCountResponse,
    EmptyNotificationResponse,
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
    ): Promise<NotificationResponse> {
        return grpcCall(this.notificationService.createNotification({
            userId,
            type,
            title,
            body,
            targetType: targetType ?? '',
            targetId: targetId ?? '',
            metadata: metadata ? JSON.stringify(metadata) : '',
        }));
    }

    // ─── Queries ────────────────────────────────────────────────────────

    listUserNotifications(
        userId: string,
        page?: number,
        limit?: number,
        unreadOnly?: boolean,
        sortBy?: string,
        sortOrder?: string,
    ): Promise<PaginatedNotificationsResponse> {
        return grpcCall(this.notificationService.listUserNotifications({
            userId,
            page: page ?? 0,
            limit: limit ?? 20,
            unreadOnly: unreadOnly ?? false,
            sortBy: sortBy ?? '',
            sortOrder: sortOrder ?? '',
        }));
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
}

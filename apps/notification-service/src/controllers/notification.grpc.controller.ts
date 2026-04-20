import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { NotificationPreferencesService } from 'services/notification-preferences.service';
import { PushSubscriptionService } from 'services/push-subscription.service';
import { appErrorToGrpcPayload, NotificationUrgency } from '@asko/shared';
import type {
    CreateNotificationRequest,
    ListUserNotificationsRequest,
    MarkAsReadRequest,
    MarkAllAsReadRequest,
    GetUnreadCountRequest,
    DeleteNotificationRequest,
    GetPreferencesRequest,
    UpdatePreferencesRequest,
    RegisterPushSubscriptionRequest,
    UnregisterPushSubscriptionRequest,
    ListPushSubscriptionsRequest,
} from '@asko/proto';
import type { NotificationEntity } from 'entities/notification.entity';

function toGrpcError(error: unknown): RpcException {
    return new RpcException(appErrorToGrpcPayload(error));
}

function entityToRecord(entity: NotificationEntity) {
    return {
        id: entity.id,
        userId: entity.userId,
        type: entity.type,
        title: entity.title,
        body: entity.body,
        targetType: entity.targetType ?? '',
        targetId: entity.targetId ?? '',
        metadata: entity.metadata ? JSON.stringify(entity.metadata) : '',
        isRead: entity.isRead,
        readAt: entity.readAt?.toISOString() ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        urgency: entity.urgency,
    };
}

@Controller()
export class NotificationGrpcController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly preferencesService: NotificationPreferencesService,
        private readonly pushSubscriptionService: PushSubscriptionService,
    ) {}

    @GrpcMethod('NotificationService', 'CreateNotification')
    async createNotification(data: CreateNotificationRequest) {
        try {
            const metadata = data.metadata ? JSON.parse(data.metadata) : undefined;
            const notification = await this.notificationService.createNotification({
                userId: data.userId,
                type: data.type,
                title: data.title,
                body: data.body,
                targetType: data.targetType || undefined,
                targetId: data.targetId || undefined,
                metadata,
                urgency: (data.urgency as NotificationUrgency) || undefined,
            });
            return { notification: entityToRecord(notification) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'ListUserNotifications')
    async listUserNotifications(data: ListUserNotificationsRequest) {
        try {
            const page = data.page ?? 1;
            const limit = data.limit ?? 20;
            const offset = (page - 1) * limit;
            const result = await this.notificationService.listUserNotifications(
                data.userId,
                {
                    offset,
                    limit,
                    unreadOnly: data.unreadOnly ?? false,
                    sortBy: data.sortBy || undefined,
                    sortOrder: data.sortOrder || undefined,
                    group: data.group || undefined,
                    readStatus: data.readStatus || undefined,
                },
            );
            return {
                data: result.data.map(entityToRecord),
                overallCount: result.overallCount,
                page,
                limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'MarkAsRead')
    async markAsRead(data: MarkAsReadRequest) {
        try {
            await this.notificationService.markAsRead(data.notificationId, data.userId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'MarkAllAsRead')
    async markAllAsRead(data: MarkAllAsReadRequest) {
        try {
            await this.notificationService.markAllAsRead(data.userId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'GetUnreadCount')
    async getUnreadCount(data: GetUnreadCountRequest) {
        try {
            const count = await this.notificationService.getUnreadCount(data.userId);
            return { count };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'DeleteNotification')
    async deleteNotification(data: DeleteNotificationRequest) {
        try {
            await this.notificationService.deleteNotification(data.notificationId, data.userId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Preferences ────────────────────────────────────────────────────

    @GrpcMethod('NotificationService', 'GetNotificationPreferences')
    async getNotificationPreferences(data: GetPreferencesRequest) {
        try {
            const prefs = await this.preferencesService.getPreferences(data.userId);
            return this.preferencesService.toProtoResponse(prefs);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'UpdateNotificationPreferences')
    async updateNotificationPreferences(data: UpdatePreferencesRequest) {
        try {
            const prefs = await this.preferencesService.updatePreferences(
                data.userId,
                data.globalMute,
                data.groups ?? [],
                data.hasGlobalMute,
            );
            return this.preferencesService.toProtoResponse(prefs);
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Push Subscriptions ─────────────────────────────────────────────

    @GrpcMethod('NotificationService', 'RegisterPushSubscription')
    async registerPushSubscription(data: RegisterPushSubscriptionRequest) {
        try {
            const sub = await this.pushSubscriptionService.register(
                data.userId,
                data.endpoint,
                data.p256dh,
                data.auth,
                data.userAgent || undefined,
            );
            return {
                id: sub.id,
                endpoint: sub.endpoint,
                createdAt: sub.createdAt.toISOString(),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'UnregisterPushSubscription')
    async unregisterPushSubscription(data: UnregisterPushSubscriptionRequest) {
        try {
            await this.pushSubscriptionService.unregister(data.userId, data.endpoint);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('NotificationService', 'ListPushSubscriptions')
    async listPushSubscriptions(data: ListPushSubscriptionsRequest) {
        try {
            const subs = await this.pushSubscriptionService.listForUser(data.userId);
            return {
                subscriptions: subs.map(s => ({
                    id: s.id,
                    endpoint: s.endpoint,
                    createdAt: s.createdAt.toISOString(),
                })),
            };
        } catch (e) { throw toGrpcError(e); }
    }
}

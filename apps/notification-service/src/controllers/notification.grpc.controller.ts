import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { appErrorToGrpcPayload } from '@asko/shared';
import type {
    CreateNotificationRequest,
    ListUserNotificationsRequest,
    MarkAsReadRequest,
    MarkAllAsReadRequest,
    GetUnreadCountRequest,
    DeleteNotificationRequest,
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
    };
}

@Controller()
export class NotificationGrpcController {
    constructor(private readonly notificationService: NotificationService) {}

    @GrpcMethod('NotificationService', 'CreateNotification')
    async createNotification(data: CreateNotificationRequest) {
        try {
            const metadata = data.metadata ? JSON.parse(data.metadata) : undefined;
            const notification = await this.notificationService.createNotification(
                data.userId,
                data.type,
                data.title,
                data.body,
                data.targetType || undefined,
                data.targetId || undefined,
                metadata,
            );
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
                offset,
                limit,
                data.unreadOnly ?? false,
                data.sortBy || undefined,
                data.sortOrder || undefined,
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
}

import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { NotificationService } from 'services/notification.service';
import { AppError } from 'common/error';
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
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 400: grpcCode = status.INVALID_ARGUMENT; break;
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
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
            const result = await this.notificationService.listUserNotifications(
                data.userId,
                data.page ?? 0,
                data.limit ?? 20,
                data.unreadOnly ?? false,
            );
            return {
                data: result.data.map(entityToRecord),
                overallCount: result.overallCount,
                page: data.page ?? 0,
                limit: data.limit ?? 20,
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

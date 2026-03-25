import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { NotificationEntity } from 'entities/notification.entity';
import { AppErrors } from 'common/error';
import { NotificationPushService } from './notification-push.service';

@Injectable()
export class NotificationService {
    constructor(
        private readonly em: EntityManager,
        private readonly pushService: NotificationPushService,
    ) {}

    @CreateRequestContext()
    async createNotification(
        userId: string,
        type: string,
        title: string,
        body: string,
        targetType?: string,
        targetId?: string,
        metadata?: Record<string, any>,
    ): Promise<NotificationEntity> {
        const notification = this.em.create(NotificationEntity, {
            userId,
            type,
            title,
            body,
            targetType,
            targetId,
            metadata,
        });
        await this.em.persistAndFlush(notification);

        // Push real-time to frontend via Redis → API gateway WebSocket
        this.pushService.pushToUser(userId, {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            targetType: notification.targetType ?? '',
            targetId: notification.targetId ?? '',
            metadata: notification.metadata ? JSON.stringify(notification.metadata) : '',
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
        }).catch(e => console.error('[NotificationService] Push failed:', e));

        return notification;
    }

    @CreateRequestContext()
    async listUserNotifications(
        userId: string,
        offset: number,
        limit: number,
        unreadOnly: boolean,
    ): Promise<{ data: NotificationEntity[]; overallCount: number }> {
        const where: FilterQuery<NotificationEntity> = { userId };
        if (unreadOnly) where.isRead = false;

        const [data, overallCount] = await this.em.findAndCount(NotificationEntity, where, {
            orderBy: { createdAt: 'DESC' },
            offset,
            limit,
        });

        return { data, overallCount };
    }

    @CreateRequestContext()
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const notification = await this.em.findOne(NotificationEntity, { id: notificationId, userId });
        if (!notification) throw AppErrors.notificationNotFound();

        notification.isRead = true;
        notification.readAt = new Date();
        await this.em.flush();
    }

    @CreateRequestContext()
    async markAllAsRead(userId: string): Promise<void> {
        const unread = await this.em.find(NotificationEntity, { userId, isRead: false });
        const now = new Date();
        for (const n of unread) {
            n.isRead = true;
            n.readAt = now;
        }
        await this.em.flush();
    }

    @CreateRequestContext()
    async getUnreadCount(userId: string): Promise<number> {
        return this.em.count(NotificationEntity, { userId, isRead: false });
    }

    @CreateRequestContext()
    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        const notification = await this.em.findOne(NotificationEntity, { id: notificationId, userId });
        if (!notification) throw AppErrors.notificationNotFound();

        await this.em.removeAndFlush(notification);
    }
}

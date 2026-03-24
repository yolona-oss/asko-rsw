import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { NotificationEntity } from 'entities/notification.entity';
import { AppErrors } from 'common/error';

@Injectable()
export class NotificationService {
    constructor(private readonly em: EntityManager) {}

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

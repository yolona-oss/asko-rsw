import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { NotificationEntity } from 'entities/notification.entity';
import { AppErrors } from 'common/error';
import { NotificationPushService } from './notification-push.service';
import { NotificationEventPublisher } from './notification-event.publisher';

const NOTIFICATION_SORTABLE_FIELDS = ['createdAt', 'isRead'] as const;

@Injectable()
export class NotificationService {
    constructor(
        private readonly em: EntityManager,
        private readonly pushService: NotificationPushService,
        private readonly eventPublisher: NotificationEventPublisher,
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

        const notificationPayload = {
            id: notification.id,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            targetType: notification.targetType ?? '',
            targetId: notification.targetId ?? '',
            metadata: notification.metadata ? JSON.stringify(notification.metadata) : '',
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
        };

        // Push real-time to frontend via Redis → API gateway WebSocket
        this.pushService.pushToUser(userId, notificationPayload)
            .catch(e => console.error('[NotificationService] Push failed:', e));

        // Forward to chat-service via RabbitMQ
        this.eventPublisher.publishCreated(notificationPayload)
            .catch(e => console.error('[NotificationService] Event publish failed:', e));

        return notification;
    }

    @CreateRequestContext()
    async listUserNotifications(
        userId: string,
        offset: number,
        limit: number,
        unreadOnly: boolean,
        sortBy?: string,
        sortOrder?: string,
    ): Promise<{ data: NotificationEntity[]; overallCount: number }> {
        const where: FilterQuery<NotificationEntity> = { userId };
        if (unreadOnly) where.isRead = false;

        const orderBy: Record<string, 'ASC' | 'DESC'> = sortBy && (NOTIFICATION_SORTABLE_FIELDS as readonly string[]).includes(sortBy)
            ? { [sortBy]: sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [data, overallCount] = await this.em.findAndCount(NotificationEntity, where, {
            orderBy,
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
    async hasUnreadForTarget(
        userId: string,
        targetType: string,
        targetId: string,
    ): Promise<boolean> {
        const count = await this.em.count(NotificationEntity, {
            userId,
            targetType,
            targetId,
            isRead: false,
        });
        return count > 0;
    }

    @CreateRequestContext()
    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        const notification = await this.em.findOne(NotificationEntity, { id: notificationId, userId });
        if (!notification) throw AppErrors.notificationNotFound();

        await this.em.removeAndFlush(notification);
    }
}

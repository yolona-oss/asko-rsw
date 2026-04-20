import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { NotificationEntity } from 'entities/notification.entity';
import {
    NotificationUrgency,
    NotificationChannel,
    NOTIFICATION_TYPE_TO_GROUP,
    NotificationType,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { ChannelRegistry } from 'channels/channel-registry';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UserInfoService } from './user-info.service';
import type { NotificationPayload, ChannelContext } from 'channels/notification-channel.interface';

export interface CreateNotificationParams {
    userId: string;
    type: string;
    title: string;
    body: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    urgency?: NotificationUrgency;
}

const NOTIFICATION_SORTABLE_FIELDS = ['createdAt', 'isRead'] as const;

const GROUP_TO_TYPES = new Map<string, readonly string[]>();
{
    const mutable = new Map<string, string[]>();
    for (const [type, group] of Object.entries(NOTIFICATION_TYPE_TO_GROUP)) {
        const list = mutable.get(group) ?? [];
        list.push(type);
        mutable.set(group, list);
    }
    for (const [group, list] of mutable) {
        GROUP_TO_TYPES.set(group, Object.freeze(list));
    }
}

export interface ListNotificationsParams {
    offset: number;
    limit: number;
    unreadOnly?: boolean;
    sortBy?: string;
    sortOrder?: string;
    group?: string;
    readStatus?: string;
}

@Injectable()
export class NotificationService {
    constructor(
        private readonly em: EntityManager,
        private readonly channelRegistry: ChannelRegistry,
        private readonly preferencesService: NotificationPreferencesService,
        private readonly userInfoService: UserInfoService,
    ) {}

    @CreateRequestContext()
    async createNotification(params: CreateNotificationParams): Promise<NotificationEntity> {
        const { userId, type, title, body, targetType, targetId, metadata, urgency } = params;
        const notification = this.em.create(NotificationEntity, {
            userId,
            type,
            title,
            body,
            targetType,
            targetId,
            metadata,
            urgency,
        });
        await this.em.persistAndFlush(notification);

        const payload: NotificationPayload = {
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
            urgency: notification.urgency,
        };

        // Dispatch to channels based on user preferences
        this.dispatchToChannels(userId, payload, notification.urgency)
            .catch(e => console.error('[NotificationService] Channel dispatch failed:', e));

        return notification;
    }

    private async dispatchToChannels(
        userId: string,
        payload: NotificationPayload,
        urgency: NotificationUrgency,
    ): Promise<void> {
        const group = NOTIFICATION_TYPE_TO_GROUP[payload.type as NotificationType];
        const prefs = await this.preferencesService.getPreferences(userId);

        let context: ChannelContext = {};

        for (const channel of this.channelRegistry.all()) {
            const shouldDeliver = group
                ? this.preferencesService.shouldDeliver(prefs, group, channel.channelName, urgency)
                : true;

            if (!shouldDeliver) continue;

            // Lazily fetch email info only when needed
            if (channel.channelName === NotificationChannel.EMAIL && !context.userEmail) {
                const emailInfo = await this.userInfoService.getEmailInfo(userId);
                if (emailInfo) {
                    context = { userEmail: emailInfo.email, emailVerified: emailInfo.emailVerified };
                }
            }

            channel.deliver(userId, payload, context)
                .catch(e => console.error(`[NotificationService] ${channel.channelName} delivery failed:`, e));
        }
    }

    @CreateRequestContext()
    async listUserNotifications(
        userId: string,
        params: ListNotificationsParams,
    ): Promise<{ data: NotificationEntity[]; overallCount: number }> {
        const { offset, limit, unreadOnly, sortBy, sortOrder, group, readStatus } = params;
        const where: FilterQuery<NotificationEntity> = { userId };

        if (readStatus === 'unread') where.isRead = false;
        else if (readStatus === 'read') where.isRead = true;
        else if (unreadOnly) where.isRead = false;

        if (group) {
            const typesForGroup = GROUP_TO_TYPES.get(group);
            if (typesForGroup && typesForGroup.length > 0) {
                where.type = { $in: typesForGroup };
            }
        }

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

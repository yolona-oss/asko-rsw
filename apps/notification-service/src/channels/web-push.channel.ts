import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import webpush from 'web-push';
import { NotificationChannel } from '@asko/shared';
import { AppConfig } from '../app.config';
import { PushSubscriptionEntity } from 'entities/push-subscription.entity';
import type { NotificationChannelDelivery, NotificationPayload } from './notification-channel.interface';

@Injectable()
export class WebPushChannel implements NotificationChannelDelivery {
    readonly channelName = NotificationChannel.PUSH;
    private readonly enabled: boolean;

    constructor(
        private readonly em: EntityManager,
        private readonly config: AppConfig,
    ) {
        const { publicKey, privateKey, subject } = config.push;
        this.enabled = !!(publicKey && privateKey);
        if (this.enabled) {
            webpush.setVapidDetails(subject, publicKey, privateKey);
        }
    }

    async deliver(userId: string, notification: NotificationPayload): Promise<void> {
        if (!this.enabled) return;

        const fork = this.em.fork();
        const subscriptions = await fork.find(PushSubscriptionEntity, { userId });
        if (!subscriptions.length) return;

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            data: {
                type: notification.type,
                targetType: notification.targetType,
                targetId: notification.targetId,
                notificationId: notification.id,
            },
        });

        const expired: PushSubscriptionEntity[] = [];

        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        payload,
                    );
                } catch (err: any) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        expired.push(sub);
                    } else {
                        console.error(`[WebPushChannel] Failed to send to ${sub.endpoint}:`, err.message);
                    }
                }
            }),
        );

        if (expired.length) {
            for (const sub of expired) fork.remove(sub);
            await fork.flush();
        }
    }
}

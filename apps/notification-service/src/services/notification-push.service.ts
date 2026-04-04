import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '../app.config';

const NOTIFICATION_CHANNEL = 'notifications:push';

@Injectable()
export class NotificationPushService implements OnModuleDestroy {
    private readonly redis: Redis;

    constructor(private readonly config: AppConfig) {
        this.redis = new Redis(this.config.redisUrl);
        this.redis.on('error', (err) => console.error('[NotificationPush] Redis error:', err));
        this.redis.on('ready', () => console.log('[NotificationPush] Redis connected'));
    }

    async onModuleDestroy() {
        await this.redis?.quit();
    }

    async pushToUser(userId: string, notification: any): Promise<void> {
        try {
            const receivers = await this.redis.publish(NOTIFICATION_CHANNEL, JSON.stringify({
                userId,
                notification,
            }));
            console.debug(`[NotificationPush] Published to ${NOTIFICATION_CHANNEL}, receivers: ${receivers}, userId: ${userId}`);
        } catch (e) {
            console.error('[NotificationPush] Failed to publish:', e);
        }
    }
}

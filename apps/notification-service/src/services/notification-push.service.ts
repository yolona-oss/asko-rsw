import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '../app.config';

const NOTIFICATION_CHANNEL = 'notifications:push';

@Injectable()
export class NotificationPushService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis;

    constructor(private readonly config: AppConfig) {}

    onModuleInit() {
        this.redis = new Redis(this.config.redisUrl);
        this.redis.on('error', (err) => console.error('[NotificationPush] Redis error:', err));
    }

    async onModuleDestroy() {
        await this.redis?.quit();
    }

    async pushToUser(userId: string, notification: any): Promise<void> {
        try {
            await this.redis.publish(NOTIFICATION_CHANNEL, JSON.stringify({
                userId,
                notification,
            }));
        } catch (e) {
            console.error('[NotificationPush] Failed to publish:', e);
        }
    }
}

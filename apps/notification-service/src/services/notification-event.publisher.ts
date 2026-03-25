import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class NotificationEventPublisher implements OnModuleInit {
    constructor(
        @Inject('NOTIFICATION_EVENTS') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.rmqClient.connect();
        } catch (e) {
            console.error('[NotificationEventPublisher] Failed to connect to RabbitMQ, will retry on first emit:', e);
        }
    }

    async publishCreated(notification: {
        id: string;
        userId: string;
        type: string;
        title: string;
        body: string;
        targetType?: string;
        targetId?: string;
        metadata?: string | Record<string, any>;
        isRead?: boolean;
        createdAt: string;
    }): Promise<void> {
        try {
            this.rmqClient.emit('notification.created', notification);
        } catch (e) {
            console.error('[NotificationEventPublisher] Failed to emit notification.created:', e);
        }
    }
}

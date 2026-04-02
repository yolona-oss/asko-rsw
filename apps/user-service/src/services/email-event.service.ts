import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface EmailEventData {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
    metadata?: {
        type?: string;
        userId?: string;
        priority?: number;
    };
}

@Injectable()
export class EmailEventService implements OnModuleInit {
    constructor(
        @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.client.connect();
        } catch (e) {
            console.error('[EmailEventService] RabbitMQ connection failed:', e);
        }
    }

    emit(data: EmailEventData): void {
        this.client.emit('email.send', data);
    }
}

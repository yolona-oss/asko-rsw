import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum ChatEventType {
    CHAT_MESSAGE = 'chat.message',
}

export interface ChatEvent {
    type: ChatEventType;
    conversationId: string;
    messageId: string;
    senderId: string;
    /** User IDs that should receive a notification (all participants except sender) */
    recipientIds: string[];
    messageType: string;
    messageText: string;
    conversationName: string;
    timestamp: Date;
}

@Injectable()
export class ChatEventService implements OnModuleInit {
    constructor(
        @Inject('CHAT_EVENTS') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        await this.rmqClient.connect();
    }

    async emit(event: ChatEvent): Promise<void> {
        console.log(`[ChatEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }
}

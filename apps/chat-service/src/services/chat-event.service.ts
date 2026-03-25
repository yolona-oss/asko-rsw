import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum ChatEventType {
    CHAT_MESSAGE = 'chat.message',
    CONVERSATION_CREATED = 'chat.conversation_created',
    PARTICIPANT_ADDED = 'chat.participant_added',
    PARTICIPANT_REMOVED = 'chat.participant_removed',
}

export interface ChatMessageEvent {
    type: ChatEventType.CHAT_MESSAGE;
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

export interface ChatConversationCreatedEvent {
    type: ChatEventType.CONVERSATION_CREATED;
    conversationId: string;
    conversationName: string;
    conversationType: string;
    creatorId: string;
    /** Participants (excluding creator) who should be notified */
    recipientIds: string[];
    timestamp: Date;
}

export interface ChatParticipantEvent {
    type: ChatEventType.PARTICIPANT_ADDED | ChatEventType.PARTICIPANT_REMOVED;
    conversationId: string;
    conversationName: string;
    /** The user who was added/removed */
    targetUserId: string;
    /** The user who performed the action */
    actorId: string;
    timestamp: Date;
}

export type ChatEvent = ChatMessageEvent | ChatConversationCreatedEvent | ChatParticipantEvent;

@Injectable()
export class ChatEventService implements OnModuleInit {
    constructor(
        @Inject('CHAT_EVENTS') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.rmqClient.connect();
        } catch (e) {
            console.error('[ChatEventService] Failed to connect to RabbitMQ, will retry on first emit:', e);
        }
    }

    async emit(event: ChatEvent): Promise<void> {
        console.log(`[ChatEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }
}

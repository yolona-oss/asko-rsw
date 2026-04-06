import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    ChatServiceClient,
    ConversationResponse,
    EmptyChatResponse,
} from '@asko/proto';

@Injectable()
export class ChatClientService implements OnModuleInit {
    private chatService!: ChatServiceClient;

    constructor(
        @Inject('CHAT_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.chatService = this.client.getService<ChatServiceClient>('ChatService');
    }

    // ─── Conversations ────────────────────────────────────────────────

    createConversation(
        creatorId: string,
        type: string,
        name: string,
        participantIds: string[],
        avatarUrl?: string,
    ): Promise<ConversationResponse> {
        return grpcCall(this.chatService.createConversation({
            creatorId, type, name, participantIds, avatarUrl,
        }));
    }

    closeConversation(conversationId: string): Promise<EmptyChatResponse> {
        return grpcCall(this.chatService.closeConversation({ conversationId }));
    }

    // ─── Participants ─────────────────────────────────────────────────

    addParticipant(conversationId: string, userId: string, addedBy: string, force = false): Promise<EmptyChatResponse> {
        return grpcCall(this.chatService.addParticipant({ conversationId, userId, addedBy, force }));
    }

    removeParticipant(conversationId: string, userId: string, removedBy: string): Promise<EmptyChatResponse> {
        return grpcCall(this.chatService.removeParticipant({ conversationId, userId, removedBy }));
    }
}

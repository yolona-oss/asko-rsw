import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    ChatServiceClient,
    ParticipantListResponse,
} from '@asko/proto';

/**
 * Minimal chat client — only exposes listParticipants for file access control
 * (participants_only visibility check).
 */
@Injectable()
export class ChatClientService implements OnModuleInit {
    private chatService!: ChatServiceClient;

    constructor(
        @Inject('CHAT_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.chatService = this.client.getService<ChatServiceClient>('ChatService');
    }

    listParticipants(conversationId: string): Promise<ParticipantListResponse> {
        return grpcCall(this.chatService.listParticipants({ conversationId }));
    }
}

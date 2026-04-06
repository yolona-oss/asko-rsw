import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    ChatServiceClient,
    ConversationResponse,
    PaginatedConversationsResponse,
    PaginatedMessagesResponse,
    MessageResponse,
    EmptyChatResponse,
    ChatUnreadCountResponse,
    ParticipantListResponse,
    PresenceResponse,
    BulkPresenceResponse,
    MarkAsReadResponse,
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

    getConversation(conversationId: string, userId: string): Promise<ConversationResponse> {
        return grpcCall(this.chatService.getConversation({ conversationId, userId }));
    }

    listUserConversations(
        userId: string,
        page?: number,
        limit?: number,
        sortBy?: string,
        sortOrder?: string,
    ): Promise<PaginatedConversationsResponse> {
        return grpcCall(this.chatService.listUserConversations({
            userId, page: page ?? 0, limit: limit ?? 20, sortBy: sortBy ?? '', sortOrder: sortOrder ?? '',
        }));
    }

    deleteConversation(conversationId: string, userId: string): Promise<EmptyChatResponse> {
        return grpcCall(this.chatService.deleteConversation({ conversationId, userId }));
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

    listParticipants(conversationId: string): Promise<ParticipantListResponse> {
        return grpcCall(this.chatService.listParticipants({ conversationId }));
    }

    // ─── Messages ─────────────────────────────────────────────────────

    sendMessage(
        conversationId: string,
        senderId: string,
        type: string,
        text: string,
        attachment?: Record<string, any>,
    ): Promise<MessageResponse> {
        return grpcCall(this.chatService.sendMessage({
            conversationId,
            senderId,
            type,
            text,
            attachmentJson: attachment ? JSON.stringify(attachment) : '',
        }));
    }

    listMessages(
        conversationId: string,
        userId: string,
        page?: number,
        limit?: number,
        beforeId?: string,
        sortBy?: string,
        sortOrder?: string,
    ): Promise<PaginatedMessagesResponse> {
        return grpcCall(this.chatService.listMessages({
            conversationId,
            userId,
            page: page ?? 0,
            limit: limit ?? 50,
            beforeId: beforeId ?? '',
            sortBy: sortBy ?? '',
            sortOrder: sortOrder ?? '',
        }));
    }

    updateMessage(messageId: string, userId: string, text: string): Promise<MessageResponse> {
        return grpcCall(this.chatService.updateMessage({ messageId, userId, text }));
    }

    deleteMessage(messageId: string, userId: string): Promise<EmptyChatResponse> {
        return grpcCall(this.chatService.deleteMessage({ messageId, userId }));
    }

    markAsRead(conversationId: string, userId: string, messageId: string): Promise<MarkAsReadResponse> {
        return grpcCall(this.chatService.markAsRead({ conversationId, userId, messageId }));
    }

    getUnreadCount(userId: string): Promise<ChatUnreadCountResponse> {
        return grpcCall(this.chatService.getUnreadCount({ userId }));
    }

    // ─── Presence ─────────────────────────────────────────────────────

    updatePresence(
        userId: string,
        status: string,
        activity: string,
        conversationId?: string,
    ): Promise<EmptyChatResponse> {
        return grpcCall(this.chatService.updatePresence({
            userId, status, activity, conversationId: conversationId ?? '',
        }));
    }

    getPresence(userId: string): Promise<PresenceResponse> {
        return grpcCall(this.chatService.getPresence({ userId }));
    }

    getBulkPresence(userIds: string[]): Promise<BulkPresenceResponse> {
        return grpcCall(this.chatService.getBulkPresence({ userIds }));
    }
}

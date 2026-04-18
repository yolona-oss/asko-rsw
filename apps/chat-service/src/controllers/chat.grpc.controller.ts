import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { ConversationService } from 'services/conversation.service';
import { MessageService } from 'services/message.service';
import { PresenceService } from 'services/presence.service';
import { appErrorToGrpcPayload } from '@asko/shared';
import type {
    CreateConversationRequest,
    GetConversationRequest,
    ListUserConversationsRequest,
    DeleteConversationRequest,
    AddParticipantRequest,
    RemoveParticipantRequest,
    ListParticipantsRequest,
    SendMessageRequest,
    ListMessagesRequest,
    UpdateMessageRequest,
    DeleteMessageRequest,
    ChatMarkAsReadRequest,
    ChatGetUnreadCountRequest,
    UpdatePresenceRequest,
    GetPresenceRequest,
    CloseConversationRequest,
    GetBulkPresenceRequest,
} from '@asko/proto';
import type { Conversation } from 'entities/conversation.entity';
import type { ConversationParticipant } from 'entities/conversation-participant.entity';
import type { Message } from 'entities/message.entity';
import type { UserPresence } from 'entities/user-presence.entity';

function toGrpcError(error: unknown): RpcException {
    return new RpcException(appErrorToGrpcPayload(error));
}

function conversationToRecord(entity: Conversation, unreadCount = 0, lastMessage?: Message | null) {
    return {
        id: entity.id,
        type: entity.type,
        name: entity.name ?? '',
        creatorId: entity.creatorId,
        participants: entity.participants?.isInitialized()
            ? entity.participants.getItems().map(participantToRecord)
            : [],
        lastMessage: lastMessage ? messageToRecord(lastMessage) : undefined,
        unreadCount,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
        closedAt: entity.closedAt?.toISOString() ?? '',
    };
}

function participantToRecord(entity: ConversationParticipant) {
    return {
        id: entity.id,
        userId: entity.userId,
        conversationId: entity.conversation?.id ?? '',
        role: entity.role,
        lastReadMessageId: entity.lastReadMessageId ?? '',
        joinedAt: entity.joinedAt?.toISOString() ?? '',
    };
}

function messageToRecord(entity: Message) {
    return {
        id: entity.id,
        conversationId: entity.conversation?.id ?? '',
        senderId: entity.senderId,
        type: entity.type,
        text: entity.text ?? '',
        attachmentJson: entity.attachmentJson ? JSON.stringify(entity.attachmentJson) : '',
        isEdited: entity.isEdited,
        status: entity.status ?? '',
        deliveredAt: entity.deliveredAt?.toISOString() ?? '',
        readAt: entity.readAt?.toISOString() ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function presenceToRecord(entity: UserPresence) {
    return {
        userId: entity.userId,
        status: entity.status,
        activity: entity.activity,
        conversationId: entity.conversationId ?? '',
        lastSeenAt: entity.lastSeenAt?.toISOString() ?? '',
    };
}

@Controller()
export class ChatGrpcController {
    constructor(
        private readonly conversationService: ConversationService,
        private readonly messageService: MessageService,
        private readonly presenceService: PresenceService,
    ) {}

    // ─── Conversations ────────────────────────────────────────────────

    @GrpcMethod('ChatService', 'CreateConversation')
    async createConversation(data: CreateConversationRequest) {
        try {
            const conversation = await this.conversationService.createConversation(
                data.creatorId, data.type, data.name, data.participantIds ?? [],
            );
            return { conversation: conversationToRecord(conversation) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'GetConversation')
    async getConversation(data: GetConversationRequest) {
        try {
            const conversation = await this.conversationService.getConversation(data.conversationId, data.userId);
            const lastMessage = await this.conversationService.getLastMessage(data.conversationId);
            const unreadCount = await this.conversationService.getUnreadCountForUser(data.userId, data.conversationId);
            return { conversation: conversationToRecord(conversation, unreadCount, lastMessage) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'ListUserConversations')
    async listUserConversations(data: ListUserConversationsRequest) {
        try {
            const result = await this.conversationService.listUserConversations(
                data.userId, data.page ?? 0, data.limit ?? 20,
            );
            const records = await Promise.all(
                result.data.map(async (conv) => {
                    const lastMessage = await this.conversationService.getLastMessage(conv.id);
                    const unreadCount = await this.conversationService.getUnreadCountForUser(data.userId, conv.id);
                    return conversationToRecord(conv, unreadCount, lastMessage);
                }),
            );
            return {
                data: records,
                overallCount: result.overallCount,
                page: data.page ?? 0,
                limit: data.limit ?? 20,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'DeleteConversation')
    async deleteConversation(data: DeleteConversationRequest) {
        try {
            await this.conversationService.deleteConversation(data.conversationId, data.userId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'CloseConversation')
    async closeConversation(data: CloseConversationRequest) {
        try {
            await this.conversationService.closeConversation(data.conversationId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Participants ─────────────────────────────────────────────────

    @GrpcMethod('ChatService', 'AddParticipant')
    async addParticipant(data: AddParticipantRequest) {
        try {
            await this.conversationService.addParticipant(data.conversationId, data.userId, data.addedBy, data.force ?? false);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'RemoveParticipant')
    async removeParticipant(data: RemoveParticipantRequest) {
        try {
            await this.conversationService.removeParticipant(data.conversationId, data.userId, data.removedBy, data.force ?? false);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'ListParticipants')
    async listParticipants(data: ListParticipantsRequest) {
        try {
            const participants = await this.conversationService.listParticipants(data.conversationId, data.requesterId);
            return { participants: participants.map(participantToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Messages ─────────────────────────────────────────────────────

    @GrpcMethod('ChatService', 'SendMessage')
    async sendMessage(data: SendMessageRequest) {
        try {
            const attachment = data.attachmentJson ? JSON.parse(data.attachmentJson) : undefined;
            const message = await this.messageService.sendMessage(
                data.conversationId, data.senderId, data.type, data.text, attachment,
            );
            return { message: messageToRecord(message) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'ListMessages')
    async listMessages(data: ListMessagesRequest) {
        try {
            const result = await this.messageService.listMessages(
                data.conversationId, data.userId,
                data.page ?? 0, data.limit ?? 50,
                data.beforeId || undefined,
            );
            return {
                data: result.data.map(messageToRecord),
                overallCount: result.overallCount,
                page: data.page ?? 0,
                limit: data.limit ?? 50,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'UpdateMessage')
    async updateMessage(data: UpdateMessageRequest) {
        try {
            const message = await this.messageService.updateMessage(data.messageId, data.userId, data.text);
            return { message: messageToRecord(message) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'DeleteMessage')
    async deleteMessage(data: DeleteMessageRequest) {
        try {
            await this.messageService.deleteMessage(data.messageId, data.userId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'MarkAsRead')
    async markAsRead(data: ChatMarkAsReadRequest) {
        try {
            const affectedMessageIds = await this.messageService.markAsRead(data.conversationId, data.userId, data.messageId);
            return { affectedMessageIds };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'GetUnreadCount')
    async getUnreadCount(data: ChatGetUnreadCountRequest) {
        try {
            const count = await this.messageService.getTotalUnreadCount(data.userId);
            return { count };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Presence ─────────────────────────────────────────────────────

    @GrpcMethod('ChatService', 'UpdatePresence')
    async updatePresence(data: UpdatePresenceRequest) {
        try {
            await this.presenceService.updatePresence(
                data.userId, data.status, data.activity, data.conversationId || undefined,
            );
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'GetPresence')
    async getPresence(data: GetPresenceRequest) {
        try {
            const presence = await this.presenceService.getPresence(data.userId);
            if (!presence) {
                return {
                    presence: {
                        userId: data.userId, status: 'offline', activity: 'idle',
                        conversationId: '', lastSeenAt: '',
                    },
                };
            }
            return { presence: presenceToRecord(presence) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ChatService', 'GetBulkPresence')
    async getBulkPresence(data: GetBulkPresenceRequest) {
        try {
            const presences = await this.presenceService.getBulkPresence(data.userIds ?? []);
            return { presences: presences.map(presenceToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }
}

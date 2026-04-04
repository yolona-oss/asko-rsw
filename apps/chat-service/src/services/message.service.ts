import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Message } from 'entities/message.entity';
import { Conversation } from 'entities/conversation.entity';
import { ConversationParticipant } from 'entities/conversation-participant.entity';
import { AppErrors } from 'common/error';
import { MessageType, MessageStatus } from '@asko/shared';
import { ChatEventService, ChatEventType } from './chat-event.service';

@Injectable()
export class MessageService {
    constructor(
        private readonly em: EntityManager,
        private readonly chatEventService: ChatEventService,
    ) {}

    @CreateRequestContext()
    async sendMessage(
        conversationId: string,
        senderId: string,
        type: string,
        text: string,
        attachmentJson?: Record<string, any>,
    ): Promise<Message> {
        const conversation = await this.em.findOne(Conversation, { id: conversationId });
        if (!conversation) throw AppErrors.conversationNotFound();
        if (conversation.closedAt) throw AppErrors.conversationClosed();

        // Verify sender is a participant
        const participant = await this.em.findOne(ConversationParticipant, {
            conversation: { id: conversationId },
            userId: senderId,
        });
        if (!participant) throw AppErrors.notParticipant();

        const message = new Message();
        message.conversation = conversation;
        message.senderId = senderId;
        message.type = type as MessageType;
        message.text = text || undefined;
        message.attachmentJson = attachmentJson;
        message.status = MessageStatus.DELIVERED;
        message.deliveredAt = new Date();
        this.em.persist(message);
        await this.em.flush();

        // Update conversation's updatedAt
        conversation.updatedAt = new Date();
        await this.em.flush();

        // Emit event for notification-service
        const participants = await this.em.find(ConversationParticipant, {
            conversation: { id: conversationId },
        });
        const recipientIds = participants
            .map(p => p.userId)
            .filter(id => id !== senderId);

        if (recipientIds.length > 0) {
            this.chatEventService.emit({
                type: ChatEventType.CHAT_MESSAGE,
                conversationId,
                messageId: message.id,
                senderId,
                recipientIds,
                messageType: type,
                messageText: text || '',
                conversationName: conversation.name ?? '',
                timestamp: new Date(),
            }).catch(e => console.error('[MessageService] Failed to emit chat event:', e));
        }

        return message;
    }

    @CreateRequestContext()
    async listMessages(
        conversationId: string,
        userId: string,
        page: number,
        limit: number,
        beforeId?: string,
    ): Promise<{ data: Message[]; overallCount: number }> {
        // Verify user is a participant
        const participant = await this.em.findOne(ConversationParticipant, {
            conversation: { id: conversationId },
            userId,
        });
        if (!participant) throw AppErrors.notParticipant();

        const where: FilterQuery<Message> = { conversation: { id: conversationId } };

        if (beforeId) {
            const beforeMessage = await this.em.findOne(Message, { id: beforeId });
            if (beforeMessage) {
                where.createdAt = { $lt: beforeMessage.createdAt };
            }
        }

        const [data, overallCount] = await this.em.findAndCount(Message, where, {
            orderBy: { createdAt: 'DESC' },
            offset: ((page ?? 1) - 1) * limit,
            limit,
        });

        return { data, overallCount };
    }

    @CreateRequestContext()
    async updateMessage(messageId: string, userId: string, text: string): Promise<Message> {
        const message = await this.em.findOne(Message, { id: messageId });
        if (!message) throw AppErrors.messageNotFound();
        if (message.senderId !== userId) throw AppErrors.badRequest('Can only edit own messages');

        message.text = text;
        message.isEdited = true;
        await this.em.flush();

        return message;
    }

    @CreateRequestContext()
    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await this.em.findOne(Message, { id: messageId });
        if (!message) throw AppErrors.messageNotFound();
        if (message.senderId !== userId) throw AppErrors.badRequest('Can only delete own messages');

        await this.em.removeAndFlush(message);
    }

    @CreateRequestContext()
    async markAsRead(conversationId: string, userId: string, messageId: string): Promise<string[]> {
        const participant = await this.em.findOne(ConversationParticipant, {
            conversation: { id: conversationId },
            userId,
        });
        if (!participant) throw AppErrors.notParticipant();

        participant.lastReadMessageId = messageId;

        // Mark unread messages from others as seen
        const targetMessage = await this.em.findOne(Message, { id: messageId });
        if (targetMessage) {
            const unreadMessages = await this.em.find(Message, {
                conversation: { id: conversationId },
                senderId: { $ne: userId },
                status: { $ne: MessageStatus.SEEN },
                createdAt: { $lte: targetMessage.createdAt },
            });
            const now = new Date();
            const affectedIds: string[] = [];
            for (const msg of unreadMessages) {
                msg.status = MessageStatus.SEEN;
                msg.readAt = now;
                affectedIds.push(msg.id);
            }
            await this.em.flush();
            return affectedIds;
        }

        await this.em.flush();
        return [];
    }

    @CreateRequestContext()
    async getTotalUnreadCount(userId: string): Promise<number> {
        // Get all conversations the user participates in
        const participations = await this.em.find(ConversationParticipant, { userId });
        let total = 0;

        for (const p of participations) {
            const where: FilterQuery<Message> = {
                conversation: p.conversation,
                senderId: { $ne: userId },
            };

            if (p.lastReadMessageId) {
                const lastRead = await this.em.findOne(Message, { id: p.lastReadMessageId });
                if (lastRead) {
                    where.createdAt = { $gt: lastRead.createdAt };
                }
            }

            total += await this.em.count(Message, where);
        }

        return total;
    }
}

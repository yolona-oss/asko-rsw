import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Conversation } from 'entities/conversation.entity';
import { ConversationParticipant } from 'entities/conversation-participant.entity';
import { Message } from 'entities/message.entity';
import { AppErrors } from 'common/error';
import { ConversationType, ParticipantRole } from '@asko/shared';
import { ChatEventService, ChatEventType } from './chat-event.service';

@Injectable()
export class ConversationService {
    constructor(
        private readonly em: EntityManager,
        private readonly chatEventService: ChatEventService,
    ) {}

    @CreateRequestContext()
    async createConversation(
        creatorId: string,
        type: string,
        name: string,
        participantIds: string[],
        avatarUrl?: string,
    ): Promise<Conversation> {
        const convType = type as ConversationType;

        // For direct conversations, check if one already exists between the two users
        if (convType === ConversationType.DIRECT) {
            if (participantIds.length !== 1) {
                throw AppErrors.invalidData('Direct conversations require exactly one other participant');
            }
            const otherId = participantIds[0];
            const existing = await this.findDirectConversation(creatorId, otherId);
            if (existing) {
                throw AppErrors.directConversationExists();
            }
        }

        const conversation = new Conversation();
        conversation.type = convType;
        conversation.name = name || undefined;
        conversation.creatorId = creatorId;
        if (avatarUrl) conversation.avatarUrl = avatarUrl;
        await this.em.persistAndFlush(conversation);

        // Add creator as owner
        const creatorParticipant = this.em.create(ConversationParticipant, {
            userId: creatorId,
            conversation,
            role: ParticipantRole.OWNER,
        });
        await this.em.persist(creatorParticipant);

        // Add other participants
        for (const userId of participantIds) {
            if (userId === creatorId) continue;
            const participant = this.em.create(ConversationParticipant, {
                userId,
                conversation,
                role: ParticipantRole.MEMBER,
            });
            this.em.persist(participant);
        }

        await this.em.flush();
        await this.em.populate(conversation, ['participants']);

        // Emit conversation created event
        const recipientIds = participantIds.filter(id => id !== creatorId);
        if (recipientIds.length > 0) {
            this.chatEventService.emit({
                type: ChatEventType.CONVERSATION_CREATED,
                conversationId: conversation.id,
                conversationName: conversation.name ?? '',
                conversationType: convType,
                creatorId,
                recipientIds,
                timestamp: new Date(),
            }).catch(e => console.error('[ConversationService] Failed to emit conversation_created:', e));
        }

        return conversation;
    }

    @CreateRequestContext()
    async getConversation(conversationId: string, userId: string): Promise<Conversation> {
        const conversation = await this.em.findOne(Conversation, { id: conversationId }, {
            populate: ['participants'],
        });
        if (!conversation) throw AppErrors.conversationNotFound();

        await this.assertParticipant(conversationId, userId);

        return conversation;
    }

    @CreateRequestContext()
    async listUserConversations(
        userId: string,
        page: number,
        limit: number,
    ): Promise<{ data: Conversation[]; overallCount: number }> {
        // Find conversation IDs where user is a participant
        const participations = await this.em.find(ConversationParticipant, { userId });
        const conversationIds = participations.map(p => p.conversation.id);

        if (conversationIds.length === 0) {
            return { data: [], overallCount: 0 };
        }

        const where: FilterQuery<Conversation> = { id: { $in: conversationIds } };
        const [data, overallCount] = await this.em.findAndCount(Conversation, where, {
            populate: ['participants'],
            orderBy: { updatedAt: 'DESC' },
            offset: ((page ?? 1) - 1) * limit,
            limit,
        });

        return { data, overallCount };
    }

    @CreateRequestContext()
    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.em.findOne(Conversation, { id: conversationId });
        if (!conversation) throw AppErrors.conversationNotFound();
        if (conversation.creatorId !== userId) throw AppErrors.cannotDeleteConversation();

        // Delete all messages
        await this.em.nativeDelete(Message, { conversation: { id: conversationId } });
        // Delete all participants
        await this.em.nativeDelete(ConversationParticipant, { conversation: { id: conversationId } });
        // Delete conversation
        await this.em.removeAndFlush(conversation);
    }

    @CreateRequestContext()
    async addParticipant(conversationId: string, userId: string, addedBy: string, force = false): Promise<void> {
        const conversation = await this.em.findOne(Conversation, { id: conversationId });
        if (!conversation) throw AppErrors.conversationNotFound();

        // force=true bypasses participant check (used by API gateway for role-gated operations like manager chat accept)
        if (!force) {
            await this.assertParticipant(conversationId, addedBy);
        }

        const existing = await this.em.findOne(ConversationParticipant, {
            conversation: { id: conversationId },
            userId,
        });
        if (existing) throw AppErrors.alreadyParticipant();

        const participant = this.em.create(ConversationParticipant, {
            userId,
            conversation,
            role: ParticipantRole.MEMBER,
        });
        await this.em.persistAndFlush(participant);

        // Emit participant added event
        this.chatEventService.emit({
            type: ChatEventType.PARTICIPANT_ADDED,
            conversationId,
            conversationName: conversation.name ?? '',
            targetUserId: userId,
            actorId: addedBy,
            timestamp: new Date(),
        }).catch(e => console.error('[ConversationService] Failed to emit participant_added:', e));
    }

    @CreateRequestContext()
    async removeParticipant(conversationId: string, userId: string, removedBy: string): Promise<void> {
        const conversation = await this.em.findOne(Conversation, { id: conversationId });
        if (!conversation) throw AppErrors.conversationNotFound();

        await this.assertParticipant(conversationId, removedBy);

        const participant = await this.em.findOne(ConversationParticipant, {
            conversation: { id: conversationId },
            userId,
        });
        if (!participant) throw AppErrors.participantNotFound();

        await this.em.removeAndFlush(participant);

        // Emit participant removed event
        this.chatEventService.emit({
            type: ChatEventType.PARTICIPANT_REMOVED,
            conversationId,
            conversationName: conversation.name ?? '',
            targetUserId: userId,
            actorId: removedBy,
            timestamp: new Date(),
        }).catch(e => console.error('[ConversationService] Failed to emit participant_removed:', e));
    }

    @CreateRequestContext()
    async listParticipants(conversationId: string): Promise<ConversationParticipant[]> {
        return this.em.find(ConversationParticipant, { conversation: { id: conversationId } });
    }

    @CreateRequestContext()
    async getLastMessage(conversationId: string): Promise<Message | null> {
        return this.em.findOne(Message, { conversation: { id: conversationId } }, {
            orderBy: { createdAt: 'DESC' },
        });
    }

    @CreateRequestContext()
    async getUnreadCountForUser(userId: string, conversationId: string): Promise<number> {
        const participant = await this.em.findOne(ConversationParticipant, {
            conversation: { id: conversationId },
            userId,
        });
        if (!participant) return 0;

        const where: FilterQuery<Message> = {
            conversation: { id: conversationId },
            senderId: { $ne: userId },
        };

        if (participant.lastReadMessageId) {
            const lastRead = await this.em.findOne(Message, { id: participant.lastReadMessageId });
            if (lastRead) {
                where.createdAt = { $gt: lastRead.createdAt };
            }
        }

        return this.em.count(Message, where);
    }

    @CreateRequestContext()
    async closeConversation(conversationId: string): Promise<void> {
        const conversation = await this.em.findOne(Conversation, { id: conversationId });
        if (!conversation) throw AppErrors.conversationNotFound();
        if (conversation.closedAt) return;
        conversation.closedAt = new Date();
        await this.em.flush();
    }

    async assertParticipant(conversationId: string, userId: string): Promise<ConversationParticipant> {
        const participant = await this.em.findOne(ConversationParticipant, {
            conversation: { id: conversationId },
            userId,
        });
        if (!participant) throw AppErrors.notParticipant();
        return participant;
    }

    private async findDirectConversation(userId1: string, userId2: string): Promise<Conversation | null> {
        const qb = this.em.createQueryBuilder(Conversation, 'c');
        const result = await qb
            .where({ type: ConversationType.DIRECT })
            .andWhere({
                id: {
                    $in: this.em.createQueryBuilder(ConversationParticipant, 'p1')
                        .select('p1.conversation')
                        .where({ userId: userId1 })
                        .getKnexQuery(),
                },
            })
            .andWhere({
                id: {
                    $in: this.em.createQueryBuilder(ConversationParticipant, 'p2')
                        .select('p2.conversation')
                        .where({ userId: userId2 })
                        .getKnexQuery(),
                },
            })
            .limit(1)
            .getSingleResult();

        return result;
    }
}

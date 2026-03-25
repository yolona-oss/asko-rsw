import { Entity, PrimaryKey, Property, Index, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { Conversation } from './conversation.entity';
import { ParticipantRole } from '@asko/shared';

@Entity({ tableName: 'conversation_participant' })
export class ConversationParticipant {
    [OptionalProps]?: 'role' | 'lastReadMessageId' | 'joinedAt';

    @PrimaryKey()
    id: string = uuid();

    @Index()
    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @ManyToOne(() => Conversation)
    conversation!: Conversation;

    @Enum({ items: () => ParticipantRole, nativeEnumName: 'participant_role', default: ParticipantRole.MEMBER })
    role: ParticipantRole = ParticipantRole.MEMBER;

    @Property({ type: 'varchar', length: 255, nullable: true })
    lastReadMessageId?: string;

    @Property({ type: 'datetime' })
    joinedAt = new Date();
}

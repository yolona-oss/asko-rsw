import { Entity, PrimaryKey, Property, Index, Enum, Collection, OneToMany, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';
import { ConversationType } from '@asko/shared';

@Entity({ tableName: 'conversation' })
export class Conversation {
    [OptionalProps]?: 'name' | 'closedAt' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Enum({ items: () => ConversationType, nativeEnumName: 'conversation_type' })
    type!: ConversationType;

    @Property({ type: 'varchar', length: 255, nullable: true })
    name?: string;

    @Index()
    @Property({ type: 'varchar', length: 255 })
    creatorId!: string;

    @OneToMany(() => ConversationParticipant, p => p.conversation)
    participants = new Collection<ConversationParticipant>(this);

    @OneToMany(() => Message, m => m.conversation)
    messages = new Collection<Message>(this);

    @Property({ type: 'datetime', nullable: true })
    closedAt?: Date;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

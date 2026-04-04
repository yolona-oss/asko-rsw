import { Entity, PrimaryKey, Property, Index, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { Conversation } from './conversation.entity';
import { MessageType, MessageStatus } from '@asko/shared';

@Entity({ tableName: 'message' })
export class Message {
    [OptionalProps]?: 'text' | 'attachmentJson' | 'isEdited' | 'status' | 'deliveredAt' | 'readAt' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => Conversation)
    conversation!: Conversation;

    @Index()
    @Property({ type: 'varchar', length: 255 })
    senderId!: string;

    @Enum({ items: () => MessageType, nativeEnumName: 'message_type' })
    type!: MessageType;

    @Property({ type: 'text', nullable: true })
    text?: string;

    @Property({ type: 'json', nullable: true })
    attachmentJson?: Record<string, any>;

    @Property({ type: 'boolean', default: false })
    isEdited: boolean = false;

    @Enum({ items: () => MessageStatus, nativeEnumName: 'message_status', default: MessageStatus.DELIVERED })
    status: MessageStatus = MessageStatus.DELIVERED;

    @Property({ type: 'datetime', nullable: true })
    deliveredAt?: Date;

    @Property({ type: 'datetime', nullable: true })
    readAt?: Date;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

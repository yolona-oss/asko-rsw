import { Entity, PrimaryKey, Property, Index, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'notification' })
export class NotificationEntity {
    [OptionalProps]?: 'isRead' | 'readAt' | 'metadata' | 'createdAt' | 'targetType' | 'targetId';

    @PrimaryKey()
    id: string = uuid();

    @Index()
    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'varchar', length: 100 })
    type!: string;

    @Property({ type: 'varchar', length: 500 })
    title!: string;

    @Property({ type: 'text' })
    body!: string;

    @Property({ type: 'varchar', length: 50, nullable: true })
    targetType?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    targetId?: string;

    @Property({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Index()
    @Property({ type: 'boolean', default: false })
    isRead: boolean = false;

    @Property({ type: 'datetime', nullable: true })
    readAt?: Date;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

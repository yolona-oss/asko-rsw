import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'failed_event' })
export class FailedEventEntity {
    [OptionalProps]?: 'retryCount' | 'lastError' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    eventType!: string;

    @Property({ type: 'json' })
    payload!: Record<string, any>;

    @Property({ type: 'varchar', length: 50 })
    targetQueue!: string;

    @Property({ type: 'int', default: 0 })
    retryCount: number = 0;

    @Property({ type: 'text', nullable: true })
    lastError?: string;

    @Property({ type: 'datetime' })
    nextRetryAt!: Date;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

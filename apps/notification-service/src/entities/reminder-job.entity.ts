import { Entity, PrimaryKey, Property, Index, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

export type ReminderKind =
    | 'payment_unpaid'
    | 'repair_assignment_pending'
    | 'repair_in_progress_stuck';

export type ReminderStatus = 'active' | 'cancelled' | 'exhausted';

@Entity({ tableName: 'reminder_job' })
@Index({ properties: ['status', 'nextFireAt'], name: 'idx_reminder_job_sweep' })
@Index({ properties: ['targetType', 'targetId', 'status'], name: 'idx_reminder_job_target' })
@Index({
    properties: ['kind', 'targetType', 'targetId', 'status'],
    name: 'idx_reminder_job_kind_target',
})
export class ReminderJobEntity {
    [OptionalProps]?:
        | 'status'
        | 'fireCount'
        | 'cancelReason'
        | 'metadata'
        | 'createdAt'
        | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 50 })
    kind!: ReminderKind;

    @Property({ type: 'varchar', length: 50 })
    targetType!: string;

    @Property({ type: 'varchar', length: 255 })
    targetId!: string;

    @Property({ type: 'json' })
    recipientUserIds!: string[];

    @Property({ type: 'varchar', length: 100 })
    notificationType!: string;

    @Property({ type: 'varchar', length: 500 })
    title!: string;

    @Property({ type: 'text' })
    body!: string;

    @Property({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Property({ type: 'int' })
    intervalMs!: number;

    @Property({ type: 'datetime' })
    nextFireAt!: Date;

    @Property({ type: 'int' })
    maxFires!: number;

    @Property({ type: 'int', default: 0 })
    fireCount: number = 0;

    @Property({ type: 'varchar', length: 20, default: 'active' })
    status: ReminderStatus = 'active';

    @Property({ type: 'varchar', length: 255, nullable: true })
    cancelReason?: string;

    @Property({ type: 'datetime' })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}

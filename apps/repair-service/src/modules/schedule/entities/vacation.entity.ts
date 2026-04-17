import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { ScheduleStatus } from './schedule-status.enum';

@Entity()
export class Vacation {
    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'date' })
    dateFrom!: Date;

    @Property({ type: 'int' })
    durationDays!: number;

    @Property({ type: 'date' })
    dateTo!: Date;

    @Enum({ items: () => ScheduleStatus, default: ScheduleStatus.PENDING })
    status: ScheduleStatus = ScheduleStatus.PENDING;

    @Property({ type: 'varchar', length: 255, nullable: true })
    createdBy?: string | null;

    @Property({ type: 'varchar', length: 255, nullable: true })
    approvedBy?: string | null;

    @Property({ type: 'text', nullable: true })
    note?: string | null;

    @Property({ type: 'datetime' })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}

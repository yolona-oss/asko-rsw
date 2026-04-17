import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { ScheduleStatus } from './schedule-status.enum';

export interface PatternSlotData {
    work: boolean;
    startTime?: string | null;
    endTime?: string | null;
}

export interface PatternPendingData {
    cycleLength: number;
    anchorDate: string;
    defaultStartTime: string;
    defaultEndTime: string;
    slots: PatternSlotData[];
}

@Entity({ tableName: 'wschedule_pattern' })
export class WSchedulePattern {
    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Property({ type: 'varchar', length: 255, unique: true })
    userId!: string;

    @Property({ type: 'int' })
    cycleLength!: number;

    @Property({ type: 'date' })
    anchorDate!: Date;

    @Property({ type: 'varchar', length: 5 })
    defaultStartTime!: string;

    @Property({ type: 'varchar', length: 5 })
    defaultEndTime!: string;

    @Property({ type: 'jsonb' })
    slots!: PatternSlotData[];

    @Enum({ items: () => ScheduleStatus, default: ScheduleStatus.PENDING })
    status: ScheduleStatus = ScheduleStatus.PENDING;

    @Property({ type: 'varchar', length: 255, nullable: true })
    approvedBy?: string | null;

    @Property({ type: 'datetime', nullable: true })
    approvedAt?: Date | null;

    @Property({ type: 'jsonb', nullable: true })
    pendingData?: PatternPendingData | null;

    @Property({ type: 'datetime' })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}

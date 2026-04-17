import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import type { PatternSlotData, PatternPendingData } from './wschedule-pattern.entity';

export enum PatternChangeType {
    CREATED = 'created',
    UPDATED = 'updated',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    DELETED = 'deleted',
}

@Entity({ tableName: 'wschedule_pattern_history' })
export class WSchedulePatternHistory {
    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Property({ type: 'uuid' })
    patternId!: string;

    @Property({ type: 'varchar', length: 255 })
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

    @Property({ type: 'text' })
    status!: string;

    @Property({ type: 'jsonb', nullable: true })
    pendingData?: PatternPendingData | null;

    @Property({ type: 'text' })
    changeType!: PatternChangeType;

    @Property({ type: 'varchar', length: 255, nullable: true })
    changedBy?: string | null;

    @Property({ type: 'boolean' })
    isActive!: boolean;

    @Property({ type: 'datetime' })
    effectiveFrom!: Date;

    @Property({ type: 'datetime' })
    changedAt: Date = new Date();
}

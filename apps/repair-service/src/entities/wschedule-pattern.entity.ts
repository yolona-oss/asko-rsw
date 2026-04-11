import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

export interface PatternSlotData {
    work: boolean;
    startTime?: string | null;
    endTime?: string | null;
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

    @Property({ type: 'datetime' })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}

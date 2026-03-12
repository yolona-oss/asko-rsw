import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
export class WSchedule {
    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Property()
    startTime!: Date;

    @Property()
    endTime!: Date;

    @Property({ nullable: true })
    repeatRule?: string; // e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR" (iCal-style)
}

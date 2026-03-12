import { Entity, PrimaryKey, ManyToOne } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

import { User, WSchedule } from 'entities'

@Entity()
export class Employee {
    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => User)
    user!: User;

    @ManyToOne(() => WSchedule, { nullable: true })
    schedule?: WSchedule;
}

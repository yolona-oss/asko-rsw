import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { RepairRequest } from 'modules/repair-request/entities/repair-request.entity';
import { Repairer } from './repairer.entity';

@Entity()
export class Review {
    [OptionalProps]?: 'comment' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => RepairRequest)
    repairRequest!: RepairRequest;

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @ManyToOne(() => Repairer)
    repairer!: Repairer;

    @Property({ type: 'integer' })
    rating!: number;

    @Property({ type: 'text', nullable: true })
    comment?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

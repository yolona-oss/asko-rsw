import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { BrokenPartStatus } from '@asko/shared';
import { RepairRequest } from './repair-request.entity';
import { DevicePart } from './device-part.entity';

@Entity()
export class BrokenPart {
    [OptionalProps]?:
        | 'status'
        | 'devicePart'
        | 'note'
        | 'createdAt'
        | 'updatedAt'
        | 'externalOrderId'
        | 'supplierProvider'
        | 'orderedAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => RepairRequest)
    repairRequest!: RepairRequest;

    @ManyToOne(() => DevicePart, { nullable: true })
    devicePart?: DevicePart;

    @Property({ type: 'varchar', length: 255 })
    name!: string;

    @Enum({ items: () => BrokenPartStatus, nativeEnumName: 'broken_part_status' })
    status: BrokenPartStatus = BrokenPartStatus.ADDED;

    @Property({ type: 'text', nullable: true })
    note?: string;

    @Property({ type: 'varchar', length: 64, nullable: true })
    externalOrderId?: string;

    @Property({ type: 'varchar', length: 32, nullable: true })
    supplierProvider?: string;

    @Property({ type: 'datetime', nullable: true })
    orderedAt?: Date;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

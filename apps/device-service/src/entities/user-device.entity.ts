import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { Device } from './device.entity';
import { Address } from './address.entity';

@Entity()
export class UserDevice {
    [OptionalProps]?: 'purchaseDate' | 'warrantyUntil' | 'notes' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @ManyToOne(() => Device)
    device!: Device;

    @Property({ type: 'varchar', length: 255 })
    serialNumber!: string;

    @ManyToOne(() => Address)
    address!: Address;

    @Property({ type: 'date', nullable: true })
    purchaseDate?: Date;

    @Property({ type: 'date', nullable: true })
    warrantyUntil?: Date;

    @Property({ type: 'text', nullable: true })
    notes?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

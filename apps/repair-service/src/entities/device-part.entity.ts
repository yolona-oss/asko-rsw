import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { Device } from './device.entity';

@Entity()
export class DevicePart {
    [OptionalProps]?: 'device' | 'partNumber' | 'price' | 'description' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => Device, { nullable: true })
    device?: Device;

    @Property({ type: 'varchar', length: 255 })
    name!: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    partNumber?: string;

    @Property({ type: 'float', nullable: true })
    price?: number;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

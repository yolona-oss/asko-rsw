import { Entity, PrimaryKey, Property, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { DeviceType } from '@asko/shared';

@Entity()
export class Device {
    [OptionalProps]?: 'description' | 'specifications' | 'link' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    name!: string;

    @Enum({ items: () => DeviceType, nativeEnumName: 'device_type' })
    type!: DeviceType;

    @Property({ type: 'varchar', length: 255 })
    model!: string;

    @Property({ type: 'varchar', length: 255 })
    brand!: string;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ type: 'json', nullable: true })
    specifications?: Record<string, any>;

    @Property({ type: 'boolean', default: false, nullable: true })
    isFeatured?: boolean

    @Property({ type: 'varchar', length: 500, nullable: true })
    link?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

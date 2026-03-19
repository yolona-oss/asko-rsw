import { Entity, PrimaryKey, Property, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { DeviceType } from '@asko/shared';

@Entity()
export class Device {
    [OptionalProps]?: 'price' | 'description' | 'specifications' | 'features' | 'createdAt' | 'updatedAt';

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

    @Property({ type: 'float', nullable: true })
    price?: number;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ type: 'json', nullable: true })
    specifications?: Record<string, any>;

    @Property({ type: 'json', nullable: true })
    features?: Record<string, any>;

    @Property({ type: 'varchar', length: 255, unique: true })
    slug!: string;

    @Property({ type: 'boolean', default: false, nullable: true })
    isFeatured?: boolean

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class DeviceCategory {
    [OptionalProps]?: 'order' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255, unique: true })
    name!: string;

    @Property({ type: 'varchar', length: 255 })
    label!: string;

    @Property({ type: 'varchar', length: 255 })
    labelPlural!: string;

    @Property({ type: 'integer', default: 0 })
    order: number = 0;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

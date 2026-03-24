import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class Address {
    [OptionalProps]?: 'apartment' | 'entrance' | 'floor' | 'intercom' | 'comment' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'varchar', length: 255 })
    city!: string;

    @Property({ type: 'varchar', length: 255 })
    street!: string;

    @Property({ type: 'varchar', length: 50 })
    house!: string;

    @Property({ type: 'varchar', length: 50, nullable: true })
    apartment?: string;

    @Property({ type: 'varchar', length: 50, nullable: true })
    entrance?: string;

    @Property({ type: 'varchar', length: 50, nullable: true })
    floor?: string;

    @Property({ type: 'varchar', length: 50, nullable: true })
    intercom?: string;

    @Property({ type: 'text', nullable: true })
    comment?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

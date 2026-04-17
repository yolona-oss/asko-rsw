import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class Address {
    [OptionalProps]?: 'district' | 'building' | 'apartment' | 'entrance' | 'floor' | 'intercom' | 'comment' | 'latitude' | 'longitude' | 'timezone' | 'validationStatus' | 'validationError' | 'isPrimary' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'varchar', length: 255 })
    city!: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    district?: string;

    @Property({ type: 'varchar', length: 255 })
    street!: string;

    @Property({ type: 'varchar', length: 50 })
    house!: string;

    @Property({ type: 'varchar', length: 50, nullable: true })
    building?: string;

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

    @Property({ type: 'float', nullable: true })
    latitude?: number;

    @Property({ type: 'float', nullable: true })
    longitude?: number;

    @Property({ type: 'varchar', length: 50, nullable: true })
    timezone?: string;

    @Property({ type: 'boolean', default: false })
    isPrimary: boolean = false;

    @Property({ type: 'varchar', length: 20, default: 'pending' })
    validationStatus: string = 'pending';

    @Property({ type: 'text', nullable: true })
    validationError?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

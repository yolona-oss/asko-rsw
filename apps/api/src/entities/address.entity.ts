import { Entity, PrimaryKey, Property, t } from "@mikro-orm/core";
import { v4 as uuid } from 'uuid';

@Entity()
export class Address {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @Property({ type: t.string })
    country!: string;

    @Property({ type: t.string })
    city!: string;

    @Property({ type: t.string })
    street!: string;

    @Property({ type: t.integer })
    house!: number

    @Property({ type: t.integer, nullable: true })
    building?: number;

    @Property({ type: t.integer, nullable: true })
    floor?: number;

    @Property({ type: t.integer, nullable: true })
    room?: number;

    @Property({ nullable: true })
    postalCode?: string;
}


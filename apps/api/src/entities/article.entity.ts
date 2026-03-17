import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class Article {
    [OptionalProps]?: 'tags' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    title!: string;

    @Property({ type: 'varchar', length: 255, unique: true })
    slug!: string;

    @Property({ type: 'text' })
    text!: string;

    @Property({ type: 'json', nullable: true })
    tags?: string[];

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

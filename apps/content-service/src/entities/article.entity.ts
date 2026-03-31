import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class Article {
    [OptionalProps]?: 'description' | 'content' | 'viewCount' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    title!: string;

    @Property({ type: 'varchar', length: 255, unique: true })
    slug!: string;

    @Property({ type: 'text' })
    text!: string;

    @Property({ type: 'varchar', length: 500, nullable: true })
    description?: string;

    @Property({ type: 'jsonb', nullable: true })
    content?: Record<string, any>;

    @Property({ type: 'integer', default: 0 })
    viewCount: number = 0;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

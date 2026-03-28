import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class Article {
    [OptionalProps]?: 'content' | 'tags' | 'viewCount' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    title!: string;

    @Property({ type: 'varchar', length: 255, unique: true })
    slug!: string;

    @Property({ type: 'text' })
    text!: string;

    @Property({ type: 'jsonb', nullable: true })
    content?: Record<string, any>;

    @Property({ type: 'json', nullable: true })
    tags?: string[];

    @Property({ type: 'integer', default: 0 })
    viewCount: number = 0;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

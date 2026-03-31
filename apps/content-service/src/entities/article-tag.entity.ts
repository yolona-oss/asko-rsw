import { Entity, PrimaryKey, Property, Index, Unique, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
@Unique({ properties: ['articleId', 'tag'] })
export class ArticleTag {
    [OptionalProps]?: 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar' })
    @Index()
    articleId!: string;

    @Property({ type: 'varchar', length: 255 })
    @Index()
    tag!: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

import { Entity, PrimaryKey, Property, Index, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
@Index({ properties: ['articleId', 'userId', 'viewedAt'] })
@Index({ properties: ['articleId', 'sessionId', 'viewedAt'] })
export class ArticleView {
    [OptionalProps]?: 'viewedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar' })
    @Index()
    articleId!: string;

    @Property({ type: 'varchar', nullable: true })
    userId?: string;

    @Property({ type: 'varchar' })
    sessionId!: string;

    @Property({ type: 'datetime' })
    viewedAt = new Date();
}

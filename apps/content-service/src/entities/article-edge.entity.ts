import { Entity, PrimaryKey, Property, Unique, Index, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

export enum EdgeType {
    TAG = 'tag',
    VIEW = 'view',
    MANUAL = 'manual',
}

@Entity()
@Unique({ properties: ['sourceId', 'targetId'] })
export class ArticleEdge {
    [OptionalProps]?: 'weight' | 'edgeType' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar' })
    @Index()
    sourceId!: string;

    @Property({ type: 'varchar' })
    @Index()
    targetId!: string;

    @Property({ type: 'float', default: 0 })
    weight: number = 0;

    @Enum({ items: () => EdgeType, default: EdgeType.TAG })
    edgeType: EdgeType = EdgeType.TAG;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

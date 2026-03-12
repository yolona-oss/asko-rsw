import { ImageTypeEnum } from '@asko/shared';
import { Entity, PrimaryKey, Property, OptionalProps, t, Enum } from '@mikro-orm/core';
import { ImageObj } from 'entities/image.obj';
import { v4 } from 'uuid';

@Entity()
export class Image {
    [OptionalProps]?: 'altText' | 'order' | 'ownerType' | 'ownerId' | 'blankType' | 'createdAt' | 'updatedAt';

    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Property({ type: 'json' })
    image: ImageObj;

    @Property({ nullable: true })
    alt?: string;

    @Property({ default: 0 })
    order: number = 0;

    @Enum({ items: () => ImageTypeEnum, type: 'varchar', nullable: true })
    ownerType?: ImageTypeEnum;

    @Property({ nullable: true })
    ownerId?: string;

    @Enum({ items: () => ImageTypeEnum, type: 'varchar', nullable: true })
    blankType?: ImageTypeEnum;

    @Property()
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}

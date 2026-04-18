import { ImageTypeEnum } from '@asko/shared';
import { Entity, PrimaryKey, Property, OptionalProps, Enum } from '@mikro-orm/core';
import { ImageObj } from 'image/image.obj';
import { v4 } from 'uuid';

@Entity()
export class Image {
    [OptionalProps]?: 'altText' | 'order' | 'ownerType' | 'ownerId' | 'createdAt' | 'updatedAt';

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

    @Property()
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}

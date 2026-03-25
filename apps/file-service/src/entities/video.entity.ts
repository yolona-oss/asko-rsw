import { VideoTypeEnum } from '@asko/shared';
import { Entity, PrimaryKey, Property, OptionalProps, Enum } from '@mikro-orm/core';
import { VideoMetadata } from 'entities/video-metadata.obj';
import { v4 } from 'uuid';

@Entity()
export class Video {
    [OptionalProps]?: 'order' | 'ownerType' | 'ownerId' | 'createdAt' | 'updatedAt';

    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Property({ type: 'json' })
    video: VideoMetadata;

    @Property({ default: 0 })
    order: number = 0;

    @Enum({ items: () => VideoTypeEnum, type: 'varchar', nullable: true })
    ownerType?: VideoTypeEnum;

    @Property({ nullable: true })
    ownerId?: string;

    @Property()
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}

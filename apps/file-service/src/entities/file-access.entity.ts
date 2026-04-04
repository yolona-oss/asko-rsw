import { Entity, PrimaryKey, Property, Enum, Index, OptionalProps } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { FileVisibility } from '@asko/shared';

@Entity({ tableName: 'file_access' })
export class FileAccess {
    [OptionalProps]?: 'visibility' | 'creatorId' | 'conversationId' | 'createdAt';

    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Index()
    @Property({ type: 'varchar', length: 255 })
    fileId!: string;

    @Property({ type: 'varchar', length: 10 })
    fileType!: string; // 'image' | 'video'

    @Enum({ items: () => FileVisibility, default: FileVisibility.PUBLIC })
    visibility: FileVisibility = FileVisibility.PUBLIC;

    @Property({ type: 'varchar', length: 255, nullable: true })
    creatorId?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    conversationId?: string;

    @Property()
    createdAt: Date = new Date();
}

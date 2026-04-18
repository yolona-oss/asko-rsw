import { Entity, PrimaryKey, Property, OptionalProps, Index } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity({ tableName: 'document' })
export class Document {
    [OptionalProps]?: 'publicId' | 'createdAt';

    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Index()
    @Property({ type: 'varchar', length: 32 })
    ownerType!: string;

    @Index()
    @Property({ type: 'varchar', length: 255 })
    ownerId!: string;

    @Property({ type: 'varchar', length: 1024 })
    storageUrl!: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    publicId?: string;

    @Property({ type: 'varchar', length: 128 })
    mimeType!: string;

    @Property({ type: 'varchar', length: 255 })
    filename!: string;

    @Property({ type: 'bigint', default: 0 })
    sizeBytes: number = 0;

    @Property()
    createdAt: Date = new Date();
}

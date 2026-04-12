import { Entity, PrimaryKey, Property, Index, OptionalProps } from '@mikro-orm/core';

@Entity({ tableName: 'audience_membership' })
@Index({ properties: ['audienceKey'], name: 'idx_audience_membership_key' })
export class AudienceMembershipEntity {
    [OptionalProps]?: 'source' | 'metadata' | 'addedAt';

    @PrimaryKey({ type: 'varchar', length: 255 })
    userId!: string;

    @PrimaryKey({ type: 'varchar', length: 100 })
    audienceKey!: string;

    @Property({ type: 'varchar', length: 100, nullable: true })
    source?: string;

    @Property({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Property({ type: 'datetime' })
    addedAt: Date = new Date();
}

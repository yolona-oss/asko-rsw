import { Entity, PrimaryKey, Property, Index, Unique, OptionalProps } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity({ tableName: 'user_oauth_link' })
@Unique({ properties: ['provider', 'providerId'] })
export class UserOAuthLink {
    [OptionalProps]?: 'email' | 'avatarUrl' | 'createdAt';

    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Index()
    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'varchar', length: 50 })
    provider!: string;

    @Property({ type: 'varchar', length: 255 })
    providerId!: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    @Property({ type: 'varchar', length: 500, nullable: true })
    avatarUrl?: string;

    @Property()
    createdAt: Date = new Date();
}

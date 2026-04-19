import { Entity, PrimaryKey, Property, Index, Unique, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'push_subscription' })
@Unique({ properties: ['endpoint'], name: 'uq_push_subscription_endpoint' })
export class PushSubscriptionEntity {
    [OptionalProps]?: 'userAgent' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Index({ name: 'idx_push_subscription_user' })
    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'text' })
    endpoint!: string;

    @Property({ type: 'text' })
    p256dh!: string;

    @Property({ type: 'text' })
    auth!: string;

    @Property({ type: 'varchar', length: 500, nullable: true })
    userAgent?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

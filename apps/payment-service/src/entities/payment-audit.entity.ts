import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'payment_audit' })
export class PaymentAuditEntity {
    [OptionalProps]?: 'fromStatus' | 'reason' | 'metadata' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    paymentId!: string;

    @Property({ type: 'varchar', length: 50, nullable: true })
    fromStatus?: string;

    @Property({ type: 'varchar', length: 50 })
    toStatus!: string;

    @Property({ type: 'varchar', length: 255 })
    actor!: string;

    @Property({ type: 'varchar', length: 500, nullable: true })
    reason?: string;

    @Property({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

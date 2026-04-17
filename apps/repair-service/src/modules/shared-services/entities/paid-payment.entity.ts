import { Entity, PrimaryKey, Property, Unique, Index } from '@mikro-orm/core';

/**
 * Denormalized cache of paid payments. Populated by the `payment.paid`
 * RMQ consumer in this service; consulted by `CertificateService` to
 * cross-check certificate integrity without calling payment-service
 * synchronously.
 *
 * One row per `(targetType, targetId)` pair — the consumer upserts so
 * duplicate `payment.paid` deliveries are idempotent.
 */
@Entity({ tableName: 'paid_payment' })
@Unique({ properties: ['targetType', 'targetId'] })
export class PaidPayment {
    @PrimaryKey({ type: 'varchar', length: 255 })
    paymentId!: string;

    @Property({ type: 'varchar', length: 50 })
    @Index()
    targetType!: string;

    @Property({ type: 'varchar', length: 255 })
    targetId!: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    userId?: string;

    @Property({ type: 'float', nullable: true })
    amount?: number;

    @Property({ type: 'varchar', length: 10, nullable: true })
    currency?: string;

    @Property({ type: 'datetime' })
    paidAt: Date = new Date();
}

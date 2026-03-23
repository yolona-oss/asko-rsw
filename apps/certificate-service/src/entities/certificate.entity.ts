import { Entity, PrimaryKey, Property, Enum, Unique, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { CertificateStatus } from '@asko/shared';

@Entity()
export class Certificate {
    [OptionalProps]?: 'dealerId' | 'status' | 'issuedAt' | 'price' | 'paid' | 'purchaseReceiptUrl' | 'description' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar' })
    userId!: string;

    @Property({ type: 'varchar' })
    userDeviceId!: string;

    @Property({ type: 'varchar', nullable: true })
    dealerId?: string;

    @Property({ type: 'varchar', length: 100 })
    @Unique()
    certificateNumber!: string;

    @Enum({ items: () => CertificateStatus, nativeEnumName: 'certificate_status' })
    status: CertificateStatus = CertificateStatus.PENDING_PAYMENT;

    @Property({ type: 'datetime' })
    issuedAt: Date = new Date();

    @Property({ type: 'datetime' })
    expiresAt!: Date;

    @Property({ type: 'float', nullable: true })
    price?: number;

    @Property({ type: 'boolean', default: false })
    paid: boolean = false;

    @Property({ type: 'varchar', length: 500, nullable: true })
    purchaseReceiptUrl?: string;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

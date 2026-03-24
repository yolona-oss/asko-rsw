import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { CertificateStatus } from '@asko/shared';
import { UserDevice } from './user-device.entity';
import { DealerProfile } from './dealer-profile.entity';

@Entity()
export class Certificate {
    [OptionalProps]?: 'status' | 'issuedAt' | 'paid' | 'createdAt' | 'dealer' | 'purchaseReceiptUrl' | 'description';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255, unique: true })
    certificateNumber!: string;

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @ManyToOne(() => UserDevice)
    userDevice!: UserDevice;

    @ManyToOne(() => DealerProfile, { nullable: true })
    dealer?: DealerProfile;

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

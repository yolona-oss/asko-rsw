import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { PaymentStatus, CurrencyEnum } from '@asko/shared';
import { RepairRequest } from './repair-request.entity';
import { User } from './auth/user.entity';

@Entity()
export class RepairPayment {
    [OptionalProps]?: 'currency' | 'status' | 'provider' | 'providerPaymentId' | 'paidAt' | 'createdAt' | 'targetType' | 'targetId' | 'repairRequest' | 'user';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => User, { nullable: true })
    user?: User;

    @ManyToOne(() => RepairRequest, { nullable: true })
    repairRequest?: RepairRequest;

    @Property({ type: 'varchar', length: 50, nullable: true })
    targetType?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    targetId?: string;

    @Property({ type: 'float' })
    amount!: number;

    @Property({ type: 'varchar', length: 10, default: CurrencyEnum.DEFAULT })
    currency: string = CurrencyEnum.DEFAULT;

    @Enum({ items: () => PaymentStatus, nativeEnumName: 'payment_status' })
    status: PaymentStatus = PaymentStatus.PENDING;

    @Property({ type: 'varchar', length: 255, nullable: true })
    provider?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    providerPaymentId?: string;

    @Property({ type: 'datetime', nullable: true })
    paidAt?: Date;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

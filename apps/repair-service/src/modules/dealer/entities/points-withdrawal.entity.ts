import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { WithdrawalStatus } from '@asko/shared';
import { DealerProfile } from './dealer-profile.entity';

@Entity()
export class PointsWithdrawal {
    [OptionalProps]?: 'status' | 'requestedAt' | 'processedAt' | 'processedByUserId' | 'cardNumber' | 'cardHolderName';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => DealerProfile)
    dealer!: DealerProfile;

    @Property({ type: 'integer' })
    amount!: number;

    @Enum({ items: () => WithdrawalStatus, nativeEnumName: 'withdrawal_status' })
    status: WithdrawalStatus = WithdrawalStatus.PENDING;

    @Property({ type: 'datetime' })
    requestedAt = new Date();

    @Property({ type: 'datetime', nullable: true })
    processedAt?: Date;

    @Property({ type: 'varchar', length: 255, nullable: true })
    processedByUserId?: string;

    @Property({ type: 'varchar', length: 20, nullable: true })
    cardNumber?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    cardHolderName?: string;
}

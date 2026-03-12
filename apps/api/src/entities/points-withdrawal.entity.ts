import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { WithdrawalStatus } from '@asko/shared';
import { DealerProfile } from './dealer-profile.entity';
import { User } from './auth/user.entity';

@Entity()
export class PointsWithdrawal {
    [OptionalProps]?: 'status' | 'requestedAt' | 'processedAt' | 'processedBy';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => DealerProfile)
    dealer!: DealerProfile;

    @Property({ type: 'integer' })
    amount!: number;

    @Enum({ items: () => WithdrawalStatus, nativeEnumName: 'withdrawal_status' })
    status: WithdrawalStatus = WithdrawalStatus.PENDING;

    @Property({ type: 'datetime' })
    requestedAt: Date = new Date();

    @Property({ type: 'datetime', nullable: true })
    processedAt?: Date;

    @ManyToOne(() => User, { nullable: true })
    processedBy?: User;
}

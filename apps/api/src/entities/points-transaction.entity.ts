import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { PointsTransactionType } from '@asko/shared';
import { DealerProfile } from './dealer-profile.entity';

@Entity()
export class PointsTransaction {
    [OptionalProps]?: 'repairRequestId' | 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => DealerProfile)
    dealer!: DealerProfile;

    @Enum({ items: () => PointsTransactionType, nativeEnumName: 'points_transaction_type' })
    type!: PointsTransactionType;

    @Property({ type: 'integer' })
    amount!: number;

    @Property({ type: 'varchar', length: 500 })
    reason!: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    repairRequestId?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

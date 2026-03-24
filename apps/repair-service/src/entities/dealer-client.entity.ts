import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { DealerProfile } from './dealer-profile.entity';

@Entity()
export class DealerClient {
    [OptionalProps]?: 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => DealerProfile)
    dealer!: DealerProfile;

    @Property({ type: 'varchar', length: 255 })
    clientUserId!: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

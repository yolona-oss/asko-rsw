import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { DealerProfile } from './dealer-profile.entity';
import { User } from './auth/user.entity';

@Entity()
export class DealerClient {
    [OptionalProps]?: 'createdAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => DealerProfile)
    dealer!: DealerProfile;

    @ManyToOne(() => User)
    clientUser!: User;

    @Property({ type: 'datetime' })
    createdAt = new Date();
}

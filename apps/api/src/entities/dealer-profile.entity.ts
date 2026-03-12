import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { User } from './auth/user.entity';
import { DealerClient } from './dealer-client.entity';

@Entity()
export class DealerProfile {
    [OptionalProps]?: 'companyName' | 'inn' | 'pointsBalance' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => User)
    user!: User;

    @Property({ type: 'varchar', length: 255, nullable: true })
    companyName?: string;

    @Property({ type: 'varchar', length: 20, nullable: true })
    inn?: string;

    @Property({ type: 'integer', default: 0 })
    pointsBalance: number = 0;

    @OneToMany(() => DealerClient, dc => dc.dealer)
    clients = new Collection<DealerClient>(this);

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

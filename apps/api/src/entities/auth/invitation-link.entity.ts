import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { User } from './user.entity';
import { Role } from '@asko/shared';

@Entity()
export class InvitationLink {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @Property({ type: 'varchar', length: 255, unique: true })
    token!: string;

    @Enum({ items: () => Role })
    role!: Role;

    @Property({ type: 'integer', comment: 'TTL in seconds' })
    ttl!: number;

    @Property({ type: 'boolean', default: false })
    used: boolean = false;

    @ManyToOne(() => User)
    createdBy!: User;

    @Property({ type: 'datetime' })
    expiresAt!: Date;

    @Property({ type: 'datetime' })
    createdAt: Date = new Date();
}

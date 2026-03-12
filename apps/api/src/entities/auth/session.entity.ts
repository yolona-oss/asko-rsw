import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { User } from './user.entity';
import { TokenType } from '@asko/shared';

@Entity()
export class Session {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { inversedBy: 'sessions' })
    user!: User;

    @Enum({ items: () => TokenType, default: TokenType.REFRESH })
    type = TokenType.REFRESH;

    // HASHED
    @Property()
    token!: string;

    @Property()
    deviceInfo!: string;

    @Property()
    ipAddress!: string;

    @Property()
    expiresAt!: Date;

    @Property()
    createdAt: Date = new Date();
}

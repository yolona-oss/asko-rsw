import { Entity, PrimaryKey, Property, OneToMany, Unique, Collection, Cascade, OptionalProps, t, Enum } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { DEFAULT_USER_ROLE, Role, AuthProvider } from '@asko/shared';

import { Session } from './session.entity';
import { UserAddress } from './user-address.entity';

export type UserPopulateHints = "sessions" | "addresses" | "roles"

@Entity()
export class User {
    [OptionalProps]?:
    'firstName'
    | 'lastName'
    | 'email'
    | 'passwordHash'
    | 'phone'
    | 'googleId'
    | 'isActive'
    | 'emailVerified'
    | 'phoneVerified'
    | 'preferences';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255, nullable: true })
    firstName?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    lastName?: string;

    @Property({ nullable: true })
    @Unique()
    email?: string;

    @Property({ nullable: true })
    passwordHash?: string;

    @Property({ nullable: true })
    @Unique()
    phone?: string;

    @OneToMany(() => UserAddress, ua => ua.user)
    addresses = new Collection<UserAddress>(this)

    @Enum({ items: () => Role, array: true, default: [DEFAULT_USER_ROLE], nativeEnumName: 'role' })
    roles: Role[] = [DEFAULT_USER_ROLE];

    @Property({ type: 'json', nullable: true })
    preferences?: Record<string, any>;

    @OneToMany(() => Session, s => s.user, { cascade: [Cascade.REMOVE], lazy: true })
    sessions = new Collection<Session>(this);

    @Property({ default: [AuthProvider.EMAIL], type: t.array })
    providers: AuthProvider[] = [AuthProvider.EMAIL];

    @Property({ nullable: true })
    googleId?: string;

    @Property({ type: 'boolean', default: true })
    isActive: boolean = true;

    @Property({ type: 'boolean', default: false })
    emailVerified: boolean = false;

    @Property({ type: 'boolean', default: false })
    phoneVerified: boolean = false;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

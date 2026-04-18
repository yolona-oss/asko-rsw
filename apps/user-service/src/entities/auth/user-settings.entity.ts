import { Entity, PrimaryKey, Property, OneToOne, OptionalProps } from '@mikro-orm/core';
import { User } from './user.entity';

@Entity({ tableName: 'user_settings' })
export class UserSettings {
    [OptionalProps]?:
        | 'mfaMethods'
        | 'chatAcceptConversations'
        | 'chatSearchable'
        | 'language'
        | 'meta'
        | 'createdAt'
        | 'updatedAt';

    @PrimaryKey()
    id!: number;

    @OneToOne(() => User, u => u.settings)
    user!: User;

    @Property({ type: 'array', default: [] })
    mfaMethods: string[] = [];

    @Property({ type: 'boolean', default: false })
    chatAcceptConversations: boolean = false;

    @Property({ type: 'boolean', default: false })
    chatSearchable: boolean = false;

    @Property({ type: 'varchar', length: 5, default: 'ru' })
    language: string = 'ru';

    @Property({ type: 'json', nullable: true })
    meta?: Record<string, any> | null;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}

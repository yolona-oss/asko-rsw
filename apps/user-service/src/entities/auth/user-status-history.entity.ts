import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity({ tableName: 'user_status_history' })
export class UserStatusHistory {
    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'boolean' })
    isActive!: boolean;

    @Property({ type: 'varchar', length: 255, nullable: true })
    changedBy?: string | null;

    @Property({ type: 'datetime' })
    changedAt: Date = new Date();
}

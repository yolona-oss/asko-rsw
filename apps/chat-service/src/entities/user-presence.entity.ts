import { Entity, PrimaryKey, Property, Index, Enum, OptionalProps } from '@mikro-orm/core';
import { PresenceStatus, UserActivity } from '@asko/shared';

@Entity({ tableName: 'user_presence' })
export class UserPresence {
    [OptionalProps]?: 'status' | 'activity' | 'conversationId' | 'lastSeenAt';

    @PrimaryKey()
    @Index()
    userId!: string;

    @Enum({ items: () => PresenceStatus, nativeEnumName: 'presence_status', default: PresenceStatus.OFFLINE })
    status: PresenceStatus = PresenceStatus.OFFLINE;

    @Enum({ items: () => UserActivity, nativeEnumName: 'user_activity', default: UserActivity.IDLE })
    activity: UserActivity = UserActivity.IDLE;

    @Property({ type: 'varchar', length: 255, nullable: true })
    conversationId?: string;

    @Property({ type: 'datetime' })
    lastSeenAt = new Date();
}

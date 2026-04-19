import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';

@Entity({ tableName: 'notification_preferences' })
export class NotificationPreferencesEntity {
    [OptionalProps]?: 'globalMute' | 'updatedAt';

    @PrimaryKey({ type: 'varchar', length: 255 })
    userId!: string;

    @Property({ type: 'boolean', default: false })
    globalMute: boolean = false;

    /** Record<NotificationGroup, { in_app: boolean; push: boolean; email: boolean }> */
    @Property({ type: 'json' })
    groups!: Record<string, { in_app: boolean; push: boolean; email: boolean }>;

    @Property({ type: 'datetime' })
    updatedAt = new Date();
}

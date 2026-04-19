import type { NotificationGroup } from './notification-group.js';

export interface INotificationGroupChannels {
    [key: string]: boolean;
    in_app: boolean;
    push: boolean;
    email: boolean;
}

export interface INotificationPreferences {
    globalMute: boolean;
    groups: Record<NotificationGroup, INotificationGroupChannels>;
}

import { NotificationChannel } from '@asko/shared';

export interface NotificationPayload {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    targetType: string;
    targetId: string;
    metadata: string;
    isRead: boolean;
    createdAt: string;
    urgency: string;
}

export interface ChannelContext {
    userEmail?: string;
    emailVerified?: boolean;
}

export interface NotificationChannelDelivery {
    readonly channelName: NotificationChannel;
    deliver(userId: string, notification: NotificationPayload, context: ChannelContext): Promise<void>;
}

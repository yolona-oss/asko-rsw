import { NotificationType } from './notification.type.js';

export enum NotificationGroup {
    REPAIR = 'repair',
    PAYMENT = 'payment',
    SCHEDULE = 'schedule',
    CHAT = 'chat',
    CERTIFICATE = 'certificate',
    VALIDATION = 'validation',
    SYSTEM = 'system',
}

export enum NotificationChannel {
    IN_APP = 'in_app',
    PUSH = 'push',
    EMAIL = 'email',
}

export const NOTIFICATION_TYPE_TO_GROUP: Record<NotificationType, NotificationGroup> = {
    // Repair
    [NotificationType.REPAIR_STATUS_CHANGED]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_ASSIGNED]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_TRANSFERRED_TO_REPAIRER]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_TRANSFERRED_FROM_REPAIRER]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_TRANSFERRED_CLIENT]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_DIAGNOSTICS_DECLINED]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_COMPLETED]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_ASSIGNMENT_REMINDER]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_IN_PROGRESS_STUCK]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_SCHEDULE_ENDING]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_SCHEDULE_AUTO_PAUSED]: NotificationGroup.REPAIR,
    [NotificationType.REPAIR_PART_SHIPPED]: NotificationGroup.REPAIR,
    [NotificationType.AVR_SIGNING_REQUESTED]: NotificationGroup.REPAIR,
    [NotificationType.AVR_SIGNED]: NotificationGroup.REPAIR,

    // Payment
    [NotificationType.INVOICE_CREATED]: NotificationGroup.PAYMENT,
    [NotificationType.PAYMENT_PAID]: NotificationGroup.PAYMENT,
    [NotificationType.PAYMENT_FAILED]: NotificationGroup.PAYMENT,
    [NotificationType.PAYMENT_REFUNDED]: NotificationGroup.PAYMENT,
    [NotificationType.INVOICE_UNPAID_REMINDER]: NotificationGroup.PAYMENT,

    // Schedule
    [NotificationType.SCHEDULE_CREATED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_APPROVED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_REJECTED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_UPDATED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_DELETED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_EXTRA_DAY_REQUESTED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_EXTRA_DAY_ACCEPTED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_EXTRA_DAY_REJECTED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_PATTERN_CREATED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_PATTERN_UPDATED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_PATTERN_DELETED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_PATTERN_APPROVED]: NotificationGroup.SCHEDULE,
    [NotificationType.SCHEDULE_PATTERN_REJECTED]: NotificationGroup.SCHEDULE,

    // Chat
    [NotificationType.CHAT_MESSAGE]: NotificationGroup.CHAT,
    [NotificationType.CHAT_CONVERSATION_CREATED]: NotificationGroup.CHAT,
    [NotificationType.CHAT_PARTICIPANT_ADDED]: NotificationGroup.CHAT,
    [NotificationType.CHAT_PARTICIPANT_REMOVED]: NotificationGroup.CHAT,
    [NotificationType.MESSAGE]: NotificationGroup.CHAT,

    // Certificate
    [NotificationType.CERTIFICATE_ISSUED]: NotificationGroup.CERTIFICATE,
    [NotificationType.CERTIFICATE_EXPIRING_SOON]: NotificationGroup.CERTIFICATE,
    [NotificationType.CERTIFICATE_EXPIRED]: NotificationGroup.CERTIFICATE,
    [NotificationType.CERTIFICATE_INTEGRITY_FAILED]: NotificationGroup.CERTIFICATE,

    // Validation
    [NotificationType.ADDRESS_VALIDATED]: NotificationGroup.VALIDATION,
    [NotificationType.ADDRESS_VALIDATION_FAILED]: NotificationGroup.VALIDATION,
    [NotificationType.USER_DEVICE_VALIDATED]: NotificationGroup.VALIDATION,
    [NotificationType.USER_DEVICE_VALIDATION_FAILED]: NotificationGroup.VALIDATION,

    // System
    [NotificationType.SYSTEM]: NotificationGroup.SYSTEM,
};

import type { MsgKey } from '../i18n/messages.js';

export const NOTIFICATION_GROUP_MSG_KEYS: Record<NotificationGroup, MsgKey> = {
    [NotificationGroup.REPAIR]: 'notify.group.repair',
    [NotificationGroup.PAYMENT]: 'notify.group.payment',
    [NotificationGroup.SCHEDULE]: 'notify.group.schedule',
    [NotificationGroup.CHAT]: 'notify.group.chat',
    [NotificationGroup.CERTIFICATE]: 'notify.group.certificate',
    [NotificationGroup.VALIDATION]: 'notify.group.validation',
    [NotificationGroup.SYSTEM]: 'notify.group.system',
};

export const NOTIFICATION_CHANNEL_MSG_KEYS: Record<NotificationChannel, MsgKey> = {
    [NotificationChannel.IN_APP]: 'notify.channel.inApp',
    [NotificationChannel.PUSH]: 'notify.channel.push',
    [NotificationChannel.EMAIL]: 'notify.channel.email',
};

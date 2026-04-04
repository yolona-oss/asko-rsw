export enum NotificationType {
    REPAIR_STATUS_CHANGED = 'repair_status_changed',
    REPAIR_ASSIGNED = 'repair_assigned',
    REPAIR_COMPLETED = 'repair_completed',
    PAYMENT_PAID = 'payment_paid',
    PAYMENT_FAILED = 'payment_failed',
    PAYMENT_REFUNDED = 'payment_refunded',
    CERTIFICATE_ISSUED = 'certificate_issued',
    CHAT_MESSAGE = 'chat_message',
    CHAT_CONVERSATION_CREATED = 'chat_conversation_created',
    CHAT_PARTICIPANT_ADDED = 'chat_participant_added',
    CHAT_PARTICIPANT_REMOVED = 'chat_participant_removed',
    MESSAGE = 'message',
    SYSTEM = 'system',
    SCHEDULE_CREATED = 'schedule_created',
    SCHEDULE_APPROVED = 'schedule_approved',
    SCHEDULE_REJECTED = 'schedule_rejected',
    SCHEDULE_UPDATED = 'schedule_updated',
}

export enum NotificationTargetType {
    REPAIR_REQUEST = 'repairRequest',
    PAYMENT = 'payment',
    CERTIFICATE = 'certificate',
    CONVERSATION = 'conversation',
    SCHEDULE = 'schedule',
    SYSTEM = 'system',
}

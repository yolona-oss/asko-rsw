export enum NotificationType {
    REPAIR_STATUS_CHANGED = 'repair_status_changed',
    REPAIR_ASSIGNED = 'repair_assigned',
    REPAIR_COMPLETED = 'repair_completed',
    PAYMENT_PAID = 'payment_paid',
    PAYMENT_FAILED = 'payment_failed',
    PAYMENT_REFUNDED = 'payment_refunded',
    CERTIFICATE_ISSUED = 'certificate_issued',
    MESSAGE = 'message',
    SYSTEM = 'system',
}

export enum NotificationTargetType {
    REPAIR_REQUEST = 'repairRequest',
    PAYMENT = 'payment',
    CERTIFICATE = 'certificate',
    SYSTEM = 'system',
}

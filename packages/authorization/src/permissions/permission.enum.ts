/**
 * Fine-grained permissions following the `resource:action` convention.
 * Mapped from roles via {@link ROLE_PERMISSIONS} in `role-permission-map.ts`.
 */
export enum Permission {
    // ── Repair Requests ──
    REPAIR_REQUEST_CREATE          = 'repair-request:create',
    REPAIR_REQUEST_VIEW_OWN        = 'repair-request:view-own',
    REPAIR_REQUEST_VIEW_ALL        = 'repair-request:view-all',
    REPAIR_REQUEST_CANCEL          = 'repair-request:cancel',
    REPAIR_REQUEST_ASSIGN          = 'repair-request:assign',
    REPAIR_REQUEST_REASSIGN        = 'repair-request:reassign',
    REPAIR_REQUEST_ACCEPT          = 'repair-request:accept',
    REPAIR_REQUEST_REFUSE          = 'repair-request:refuse',
    REPAIR_REQUEST_DEPART          = 'repair-request:depart',
    REPAIR_REQUEST_START_WORK      = 'repair-request:start-work',
    REPAIR_REQUEST_SET_PRICE       = 'repair-request:set-price',
    REPAIR_REQUEST_COMPLETE        = 'repair-request:complete',
    REPAIR_REQUEST_PAUSE           = 'repair-request:pause',
    REPAIR_REQUEST_RESUME          = 'repair-request:resume',
    REPAIR_REQUEST_REFUND_REQUEST  = 'repair-request:request-refund',
    REPAIR_REQUEST_REFUND_APPROVE  = 'repair-request:approve-refund',
    REPAIR_REQUEST_REFUND_DENY     = 'repair-request:deny-refund',
    REPAIR_REQUEST_MANAGE_CHAT     = 'repair-request:manage-chat',
    REPAIR_REQUEST_UPLOAD          = 'repair-request:upload',
    REPAIR_REQUEST_METRICS         = 'repair-request:metrics',
    REPAIR_REQUEST_AVR             = 'repair-request:avr',
    REPAIR_REQUEST_STEPS           = 'repair-request:steps',
    REPAIR_REQUEST_BROKEN_PARTS    = 'repair-request:broken-parts',
    REPAIR_REQUEST_ACCEPT_COMPLETION = 'repair-request:accept-completion',
    REPAIR_REQUEST_CONFIRM_PRESENCE  = 'repair-request:confirm-presence',
    REPAIR_REQUEST_REFUND_CANCEL     = 'repair-request:cancel-refund',
    REPAIR_REQUEST_STAFF_SET_PRICE   = 'repair-request:staff-set-price',
    REPAIR_REQUEST_OVERRIDE_CERT_PRICE = 'repair-request:override-cert-price',

    // ── Schedule ──
    SCHEDULE_CREATE                = 'schedule:create',
    SCHEDULE_UPDATE_OWN            = 'schedule:update-own',
    SCHEDULE_UPDATE_ANY            = 'schedule:update-any',
    SCHEDULE_VIEW_OWN              = 'schedule:view-own',
    SCHEDULE_VIEW_ALL              = 'schedule:view-all',
    SCHEDULE_DELETE                 = 'schedule:delete',
    SCHEDULE_APPROVE               = 'schedule:approve',
    SCHEDULE_PATTERN_MANAGE        = 'schedule:pattern-manage',
    SCHEDULE_PATTERN_APPROVE       = 'schedule:pattern-approve',
    SCHEDULE_REPORT                = 'schedule:report',

    // ── Files ──
    FILE_VIEW                      = 'file:view',
    FILE_UPLOAD                    = 'file:upload',
    FILE_DELETE                    = 'file:delete',
    FILE_ADMIN_MANAGE              = 'file:admin-manage',

    // ── Reviews ──
    REVIEW_CREATE                  = 'review:create',
    REVIEW_VIEW                    = 'review:view',
    REVIEW_UPLOAD_OWN              = 'review:upload-own',
    REVIEW_DELETE_IMAGE            = 'review:delete-image',

    // ── Payments ──
    PAYMENT_CREATE                 = 'payment:create',
    PAYMENT_VIEW_OWN               = 'payment:view-own',
    PAYMENT_VIEW_ALL               = 'payment:view-all',
    PAYMENT_CONFIRM_CASH           = 'payment:confirm-cash',
    PAYMENT_STATS                  = 'payment:stats',

    // ── Users ──
    USER_AVATAR_UPLOAD_OWN         = 'user:avatar-upload-own',
    USER_AVATAR_UPLOAD_ANY         = 'user:avatar-upload-any',
    USER_MANAGE                    = 'user:manage',

    // ── Chat ──
    CHAT_CREATE_CONVERSATION       = 'chat:create-conversation',
    CHAT_BYPASS_PRIVACY            = 'chat:bypass-privacy',

    // ── Devices ──
    DEVICE_MANAGE                  = 'device:manage',
    DEVICE_VIEW                    = 'device:view',
    USER_DEVICE_MANAGE             = 'user-device:manage',

    // ── Certificates ──
    CERTIFICATE_CREATE             = 'certificate:create',
    CERTIFICATE_VIEW_OWN           = 'certificate:view-own',
    CERTIFICATE_VIEW_ALL           = 'certificate:view-all',
    CERTIFICATE_MANAGE             = 'certificate:manage',

    // ── Dealers ──
    DEALER_MANAGE                  = 'dealer:manage',
    DEALER_OWN_PROFILE             = 'dealer:own-profile',

    // ── Repairers ──
    REPAIRER_MANAGE                = 'repairer:manage',
    REPAIRER_OWN_PROFILE           = 'repairer:own-profile',

    // ── Addresses ──
    ADDRESS_MANAGE_OWN             = 'address:manage-own',
    ADDRESS_VIEW_ANY               = 'address:view-any',

    // ── Content ──
    ARTICLE_MANAGE                 = 'article:manage',
    ARTICLE_UPLOAD                 = 'article:upload',

    // ── Parts ──
    PARTS_VIEW                     = 'parts:view',
    PARTS_MANAGE                   = 'parts:manage',

    // ── Invitations ──
    INVITE_MANAGE                  = 'invite:manage',

    // ── User admin ──
    USER_VIEW_ALL                  = 'user:view-all',
    USER_UPDATE_ANY                = 'user:update-any',
}

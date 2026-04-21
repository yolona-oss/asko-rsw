import { Role } from '@asko/shared';
import { Permission } from './permission.enum.js';

const ALL_PERMISSIONS = new Set(Object.values(Permission));

/**
 * Static role → permission mapping. SUPER_ADMIN and ADMIN receive every
 * permission. Other roles receive explicit subsets.
 *
 * This map is the single source of truth for "which role can do what".
 * Guards resolve user permissions at request time by unioning the sets
 * for each role in `AccessTokenPayload.roles`.
 */
export const ROLE_PERMISSIONS: ReadonlyMap<Role, ReadonlySet<Permission>> = new Map([
    [Role.SUPER_ADMIN, ALL_PERMISSIONS],
    [Role.ADMIN, ALL_PERMISSIONS],

    [Role.MANAGER, new Set([
        // Repair requests
        Permission.REPAIR_REQUEST_VIEW_ALL,
        Permission.REPAIR_REQUEST_ASSIGN,
        Permission.REPAIR_REQUEST_REASSIGN,
        Permission.REPAIR_REQUEST_REFUND_APPROVE,
        Permission.REPAIR_REQUEST_REFUND_DENY,
        Permission.REPAIR_REQUEST_STAFF_SET_PRICE,
        Permission.REPAIR_REQUEST_OVERRIDE_CERT_PRICE,
        Permission.REPAIR_REQUEST_MANAGE_CHAT,
        Permission.REPAIR_REQUEST_METRICS,
        Permission.REPAIR_REQUEST_UPLOAD,
        Permission.REPAIR_REQUEST_BROKEN_PARTS,
        Permission.REPAIR_REQUEST_AVR,
        // Schedule
        Permission.SCHEDULE_CREATE,
        Permission.SCHEDULE_UPDATE_OWN,
        Permission.SCHEDULE_UPDATE_ANY,
        Permission.SCHEDULE_VIEW_OWN,
        Permission.SCHEDULE_VIEW_ALL,
        Permission.SCHEDULE_APPROVE,
        Permission.SCHEDULE_PATTERN_MANAGE,
        Permission.SCHEDULE_PATTERN_APPROVE,
        Permission.SCHEDULE_REPORT,
        // Payments
        Permission.PAYMENT_VIEW_ALL,
        Permission.PAYMENT_CONFIRM_CASH,
        Permission.PAYMENT_STATS,
        // Chat
        Permission.CHAT_CREATE_CONVERSATION,
        Permission.CHAT_BYPASS_PRIVACY,
        // Repairers
        Permission.REPAIRER_MANAGE,
        // Devices
        Permission.DEVICE_VIEW,
        Permission.PARTS_VIEW,
        // Addresses
        Permission.ADDRESS_VIEW_ANY,
        // Dealers
        Permission.DEALER_MANAGE,
        // Files
        Permission.FILE_VIEW,
        // Invitations
        Permission.INVITE_MANAGE,
        // User admin
        Permission.USER_VIEW_ALL,
        Permission.USER_UPDATE_ANY,
    ])],

    [Role.DEALER, new Set([
        Permission.CERTIFICATE_CREATE,
        Permission.CERTIFICATE_VIEW_OWN,
        Permission.DEALER_OWN_PROFILE,
        Permission.USER_DEVICE_MANAGE,
        Permission.DEVICE_VIEW,
        Permission.ADDRESS_MANAGE_OWN,
        Permission.CHAT_CREATE_CONVERSATION,
        Permission.FILE_VIEW,
        // Schedule
        Permission.SCHEDULE_CREATE,
        Permission.SCHEDULE_UPDATE_OWN,
        Permission.SCHEDULE_VIEW_ALL,
        Permission.SCHEDULE_PATTERN_MANAGE,
        Permission.SCHEDULE_PATTERN_APPROVE,
    ])],

    [Role.REPAIRER, new Set([
        // Repair requests
        Permission.REPAIR_REQUEST_ACCEPT,
        Permission.REPAIR_REQUEST_REFUSE,
        Permission.REPAIR_REQUEST_DEPART,
        Permission.REPAIR_REQUEST_START_WORK,
        Permission.REPAIR_REQUEST_SET_PRICE,
        Permission.REPAIR_REQUEST_COMPLETE,
        Permission.REPAIR_REQUEST_PAUSE,
        Permission.REPAIR_REQUEST_RESUME,
        Permission.REPAIR_REQUEST_UPLOAD,
        Permission.REPAIR_REQUEST_AVR,
        Permission.REPAIR_REQUEST_STEPS,
        Permission.REPAIR_REQUEST_BROKEN_PARTS,
        Permission.REPAIR_REQUEST_CONFIRM_PRESENCE,
        Permission.REPAIR_REQUEST_VIEW_OWN,
        // Schedule
        Permission.SCHEDULE_CREATE,
        Permission.SCHEDULE_UPDATE_OWN,
        Permission.SCHEDULE_VIEW_OWN,
        Permission.SCHEDULE_PATTERN_MANAGE,
        // Payments
        Permission.PAYMENT_CONFIRM_CASH,
        Permission.PAYMENT_VIEW_OWN,
        // Repairer
        Permission.REPAIRER_OWN_PROFILE,
        // Devices
        Permission.DEVICE_VIEW,
        Permission.PARTS_VIEW,
        // Files
        Permission.FILE_VIEW,
        // Chat
        Permission.CHAT_CREATE_CONVERSATION,
        // Review
        Permission.REVIEW_VIEW,
        // Address
        Permission.ADDRESS_MANAGE_OWN,
    ])],

    [Role.USER, new Set([
        // Repair requests
        Permission.REPAIR_REQUEST_CREATE,
        Permission.REPAIR_REQUEST_VIEW_OWN,
        Permission.REPAIR_REQUEST_CANCEL,
        Permission.REPAIR_REQUEST_REFUND_REQUEST,
        Permission.REPAIR_REQUEST_REFUND_CANCEL,
        Permission.REPAIR_REQUEST_UPLOAD,
        Permission.REPAIR_REQUEST_SUGGEST_PART,
        Permission.REPAIR_REQUEST_ACCEPT_COMPLETION,
        Permission.REPAIR_REQUEST_AVR,
        Permission.REPAIR_REQUEST_STEPS,
        Permission.REPAIR_REQUEST_BROKEN_PARTS,
        // Reviews
        Permission.REVIEW_CREATE,
        Permission.REVIEW_VIEW,
        Permission.REVIEW_UPLOAD_OWN,
        Permission.REVIEW_DELETE_IMAGE,
        // Payments
        Permission.PAYMENT_CREATE,
        Permission.PAYMENT_VIEW_OWN,
        // User
        Permission.USER_AVATAR_UPLOAD_OWN,
        Permission.USER_DEVICE_MANAGE,
        // Devices
        Permission.DEVICE_VIEW,
        // Certificates
        Permission.CERTIFICATE_CREATE,
        Permission.CERTIFICATE_VIEW_OWN,
        // Chat
        Permission.CHAT_CREATE_CONVERSATION,
        // Files
        Permission.FILE_VIEW,
        Permission.FILE_UPLOAD,
        // Address
        Permission.ADDRESS_MANAGE_OWN,
    ])],
]);

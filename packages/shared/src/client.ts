// Runtime enums + pure constants + type-only DTO re-exports. No server utils.
//
// The frontend imports enums/constants as runtime values, and DTOs/interfaces as TS types only.
// DTO classes here are only used as types on the frontend — `import type` strips them at build time,
// so their class-validator decorators never ship to the browser. Request DTOs live here (not in
// api.gen) because the NestJS Swagger CLI plugin does not walk into node_modules, so shared DTOs
// come through the OpenAPI spec as empty schemas.

// Auth
export { AuthProvider } from './auth/auth-provider.enum.js';
export { TokenType } from './auth/auth-token-type.enum.js';
export { MfaMethod } from './auth/mfa-method.enum.js';

// User
export { Role, ALL_ROLES, ADMIN_ROLES, STAFF_ROLES } from './user/roles.type.js';
export { DEFAULT_USER_ROLE } from './user/default-user-role.constant.js';
export { UserAddressType } from './user/user-address-type.enum.js';
export {
    MAX_USER_PASSWORD_LENGTH,
    MIN_USER_PASSWORD_LENGTH,
    MIN_USER_PASSWORD_ENTROPY,
} from './user/password.constants.js';

// Repair
export {
    RepairRequestStatus,
    WorkStepStatus,
    BrokenPartStatus,
    PaymentStatus,
} from './repair/repair.type.js';
export type { IStatusTimestampEntry } from './repair/repair.type.js';
export { AvrStatus, AvrSigningMethod, SigningOtpChannel } from './repair/avr.enum.js';

// Certificate
export { CertificateStatus } from './certificate/certificate.type.js';
export {
    CERTIFICATE_DURATION_OPTIONS,
    CERTIFICATE_DURATION_LABELS,
    computeExpiresAt,
} from './certificate/certificate.constants.js';
export type { CertificateDurationMonths } from './certificate/certificate.constants.js';

// Payment
export { PaymentProviderType, PaymentTargetType } from './payment/payment.type.js';
export { CurrencyEnum } from './payment/currency.type.js';

// Dealer
export { PointsTransactionType, WithdrawalStatus } from './dealer/dealer.type.js';

// Schedule
export { ScheduleEntryType, ScheduleStatus } from './schedule/schedule.type.js';

// Date utilities
export {
    parseDateTime,
    startOfDay,
    todayISO,
    formatIsoDate,
    combineDateTimeMs,
    MONTH_NAMES_RU,
    pluralizeRu,
    timeToMinutes,
    countDays,
    parseDurationToMs,
    formatDate,
    formatDateLong,
    formatDateTime,
    formatDateTimeCompact,
    formatTimestamp,
    formatTimeAgo,
    formatDuration,
    formatActiveMinutes,
    formatAmount,
    isExpired,
} from './utils/date.js';

// Chat
export {
    ConversationType,
    MessageType,
    MessageStatus,
    PresenceStatus,
    UserActivity,
    ParticipantRole,
} from './chat/chat.type.js';

// Notification
export { NotificationType, NotificationTargetType } from './notification/notification.type.js';

// Address
export { AddressValidationStatus } from './address/address-validation-status.enum.js';

// Device
export { DeviceValidationStatus } from './device/device-validation-status.enum.js';
export { DeviceType } from './device/device.type.js';

// Image / video / file
export { ImageTypeEnum } from './image/image-type.enum.js';
export { VideoTypeEnum } from './video/video-type.enum.js';
export { FileVisibility } from './image/file.type.js';
export { DefaultImages } from './image/default-images.enum.js';
export type { DefaultImagesType } from './image/default-images.enum.js';

// Upload limits
export { UPLOAD_LIMITS } from './upload/upload-limits.js';
export type { UploadLimitDef, UploadKind } from './upload/upload-limits.js';

// i18n
export { msg, isMsgKey, t, DEFAULT_LOCALE, SUPPORTED_LOCALES, parseAcceptLanguage } from './i18n/index.js';
export type { MsgKey, Locale, TranslatableMessage } from './i18n/index.js';

// Common
export {
    DEFAULT_REQUEST_PAGE,
    DEFAULT_REQUEST_PER_PAGE,
} from './common/pagination.constants.js';
export {
    PASSWORD_REGEX,
    NAME_REGEX,
    SLUG_REGEX,
    BCRYPT_HASH,
} from './common/regex.js';

// ── Type-only DTO / interface re-exports ──
// These are stripped at frontend build time (imported as `type`). They exist here because
// Swagger CLI does not decorate shared DTOs, so api.gen cannot be the source of truth yet.

export type { IUser, IUserSettings } from './user/user.type.js';
export type { CreateUserDto, UpdateUserDto, UpdateUserSettingsDto } from './user/user.dto.js';
export type { ChangePasswordDto } from './user/user-actions.dto.js';

export type { LoginCredentials } from './auth/login-credentials.dto.js';
export type { CreateInvitationLinkDto } from './auth/invitation-link.dto.js';

export type { CreateAddressDto, UpdateAddressDto } from './address/address.dto.js';
export type { IAddressBook } from './address/address-book.type.js';

export type { CreateArticleDto, UpdateArticleDto } from './article/article.dto.js';

export type {
    AddCertificateDto,
    CreateCertificateDto,
    SelfCreateCertificateDto,
    ReapplyCertificateDto,
} from './certificate/certificate.dto.js';

export type { CreatePaymentDto } from './payment/payment.dto.js';

export type {
    CreateRepairRequestDto,
    AssignRepairerDto,
    SetRepairPriceDto,
    RefuseRequestDto,
    AddWorkStepDto,
    UpdateWorkStepDto,
    GenerateAvrDto,
    VerifyAvrSigningDto,
} from './repair/repair-request.dto.js';

export type {
    CreateRepairerDto,
    UpdateRepairerDto,
    UpdateLocationDto,
} from './repairer/repairer.dto.js';

export type { CreateReviewDto } from './review/review.dto.js';

export type {
    CreateDeviceDto,
    UpdateDeviceDto,
    RegisterUserDeviceDto,
    UpdateUserDeviceDto,
} from './device/device.dto.js';
export type {
    CreateDeviceCategoryDto,
    UpdateDeviceCategoryDto,
} from './device/device-category.dto.js';

export type { RequestPointsWithdrawalDto } from './dealer/dealer.dto.js';

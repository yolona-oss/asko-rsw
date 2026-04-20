/**
 * Re-export generated OpenAPI types with clean names.
 * These types are the single source of truth - generated from the backend OpenAPI spec.
 *
 * DO NOT edit manually. Regenerate with: ./scripts/openapi.sh
 */

import type { components } from './api.gen';

// ── Auth ──
export type AuthUser = components['schemas']['AuthUserDto'];
export type AuthSession = components['schemas']['AuthSessionResponseDto'];
export type AccessToken = components['schemas']['AccessTokenResponseDto'];

// ── Users ──
export type UserResponse = components['schemas']['UserResponseDto'];
export type PaginatedUsers = components['schemas']['PaginatedUsersResponseDto'];

// ── Devices ──
export type DeviceRecord = components['schemas']['DeviceRecordDto'];
export type PaginatedDevices = components['schemas']['PaginatedDevicesResponseDto'];
export type DevicePartRecord = components['schemas']['DevicePartRecordDto'];
export type DevicePartResponse = components['schemas']['DevicePartResponseDto'];
export type DevicePartList = components['schemas']['DevicePartListResponseDto'];
export type PaginatedDeviceParts = components['schemas']['PaginatedDevicePartsResponseDto'];
export type UserDeviceRecord = components['schemas']['UserDeviceRecordDto'];
export type UserDeviceList = components['schemas']['UserDeviceListResponseDto'];
export type ImportDevices = components['schemas']['ImportDevicesResponseDto'];

// ── Addresses ──
export type AddressRecord = components['schemas']['AddressRecordDto'];
export type AddressResponse = components['schemas']['AddressResponseDto'];
export type AddressList = components['schemas']['AddressListResponseDto'];

// ── Certificates ──
export type CertificateRecord = components['schemas']['CertificateRecordDto'];
export type CertificateResponse = components['schemas']['CertificateResponseDto'];
export type CertificateList = components['schemas']['CertificateListResponseDto'];
export type PaginatedCertificates = components['schemas']['PaginatedCertificatesResponseDto'];
export type CertPrice = components['schemas']['CertPriceResponseDto'];

// ── Repair Requests ──
export type RepairRequestRecord = components['schemas']['RepairRequestRecordDto'];
export type RepairRequestResponse = components['schemas']['RepairRequestResponseDto'];
export type PaginatedRepairRequests = components['schemas']['PaginatedRepairRequestsResponseDto'];

// ── Work Steps ──
export type WorkStepRecord = components['schemas']['WorkStepRecordDto'];
export type WorkStepResponse = components['schemas']['WorkStepResponseDto'];
export type WorkStepList = components['schemas']['WorkStepListResponseDto'];
export type CompleteStep = components['schemas']['CompleteStepResponseDto'];

// ── Broken Parts ──
export type BrokenPartRecord = components['schemas']['BrokenPartRecordDto'];
export type BrokenPartResponse = components['schemas']['BrokenPartResponseDto'];
export type BrokenPartList = components['schemas']['BrokenPartListResponseDto'];

// ── Repairers ──
export type RepairerRecord = components['schemas']['RepairerRecordDto'];
export type RepairerResponse = components['schemas']['RepairerResponseDto'];
export type RepairerList = components['schemas']['RepairerListResponseDto'];
export type PaginatedRepairers = components['schemas']['PaginatedRepairersResponseDto'];

// ── Reviews ──
export type ReviewRecord = components['schemas']['ReviewRecordDto'];
export type ReviewResponse = components['schemas']['ReviewResponseDto'];
export type ReviewList = components['schemas']['ReviewListResponseDto'];
export type PaginatedReviews = components['schemas']['PaginatedReviewsResponseDto'];
export type Rating = components['schemas']['RatingResponseDto'];

// ── Dealers ──
export type DealerProfileRecord = components['schemas']['DealerProfileRecordDto'];
export type DealerProfileResponse = components['schemas']['DealerProfileResponseDto'];
export type PaginatedDealers = components['schemas']['PaginatedDealersResponseDto'];
export type DealerClientRecord = components['schemas']['DealerClientRecordDto'];
export type DealerClientResponse = components['schemas']['DealerClientResponseDto'];
export type DealerClientList = components['schemas']['DealerClientListResponseDto'];
export type DealerUserDeviceRecord = components['schemas']['DealerUserDeviceRecordDto'];
export type DealerUserDeviceList = components['schemas']['DealerUserDeviceListResponseDto'];
export type PointsTransactionRecord = components['schemas']['PointsTransactionRecordDto'];
export type PaginatedPoints = components['schemas']['PaginatedPointsResponseDto'];
export type WithdrawalRecord = components['schemas']['WithdrawalRecordDto'];
export type WithdrawalResponse = components['schemas']['WithdrawalResponseDto'];
export type WithdrawalList = components['schemas']['WithdrawalListResponseDto'];
export type PaginatedWithdrawals = components['schemas']['PaginatedWithdrawalsResponseDto'];

// ── Payments ──
export type PaymentRecord = components['schemas']['PaymentRecordDto'];
export type PaymentList = components['schemas']['PaymentListResponseDto'];
export type PaginatedPayments = components['schemas']['PaginatedPaymentsResponseDto'];
export type ProcessInvoice = components['schemas']['ProcessInvoiceResponseDto'];
export type PaymentOptions = components['schemas']['PaymentOptionsResponseDto'];
export type PaymentStats = components['schemas']['PaymentStatsResponseDto'];
export type Payout = components['schemas']['PayoutResponseDto'];

// ── Images ──
export type ImageRecord = components['schemas']['ImageRecordDto'];
export type ImageResponse = components['schemas']['ImageResponseDto'];
export type ImageList = components['schemas']['ImageListResponseDto'];

// ── Notifications ──
export type NotificationRecord = components['schemas']['NotificationRecordDto'];
export type PaginatedNotifications = components['schemas']['PaginatedNotificationsResponseDto'];
export type UnreadCount = components['schemas']['UnreadCountResponseDto'];

// ── Articles ──
export type ArticleResponse = components['schemas']['ArticleResponseDto'];
export type PaginatedArticles = components['schemas']['PaginatedArticlesResponseDto'];

// ── Invitations ──
export type InviteLinkResponse = components['schemas']['InviteLinkResponseDto'];
export type InviteCreated = components['schemas']['InviteCreatedResponseDto'];

// ── Messages ──
export type MessageResponse = components['schemas']['MessageResponseDto'];
export type DeleteCount = components['schemas']['DeleteCountResponseDto'];
export type EmptyResponse = components['schemas']['EmptyResponseDto'];

// ── Videos ──
export type VideoRecord = components['schemas']['VideoRecordDto'];
export type VideoResponse = components['schemas']['VideoResponseDto'];
export type VideoList = components['schemas']['VideoListResponseDto'];
export type VideoMetadata = components['schemas']['VideoMetadataDto'];

// ── Image sub-types ──
export type CloudinaryImage = components['schemas']['CloudinaryImageDto'];
export type ImageObj = components['schemas']['ImageObjDto'];

// ── Chat ──
export type ChatParticipantRecord = components['schemas']['ParticipantRecordDto'];
export type ChatMessageRecord = components['schemas']['ChatMessageRecordDto'];
export type ConversationRecord = components['schemas']['ConversationRecordDto'];
export type ConversationResponse = components['schemas']['ConversationResponseDto'];
export type PaginatedConversations = components['schemas']['PaginatedConversationsResponseDto'];
export type ParticipantList = components['schemas']['ParticipantListResponseDto'];
export type ChatMessageResponse = components['schemas']['ChatMessageResponseDto'];
export type PaginatedMessages = components['schemas']['PaginatedMessagesResponseDto'];
export type ChatUnreadCount = components['schemas']['ChatUnreadCountResponseDto'];
export type PresenceRecord = components['schemas']['PresenceRecordDto'];
export type PresenceResponse = components['schemas']['PresenceResponseDto'];
export type BulkPresenceResponse = components['schemas']['BulkPresenceResponseDto'];

// ── OAuth ──
export type OAuthLinkRecord = components['schemas']['OAuthLinkRecordDto'];
export type OAuthLinksResponse = components['schemas']['OAuthLinksResponseDto'];

// ── Device Categories ──
export type DeviceCategoryRecord = components['schemas']['DeviceCategoryRecordDto'];
export type DeviceCategoryList = components['schemas']['DeviceCategoryListResponseDto'];

// ── Schedule ──
export type VacationRecord = components['schemas']['VacationRecordDto'];
export type SickLeaveRecord = components['schemas']['SickLeaveRecordDto'];
export type OvertimeRecord = components['schemas']['OvertimeRecordDto'];
export type ScheduleOverrideRecord = components['schemas']['ScheduleOverrideRecordDto'];
export type ScheduleEntryRecord = components['schemas']['ScheduleEntryRecordDto'];
export type PaginatedSchedules = components['schemas']['PaginatedScheduleResponseDto'];
export type PatternSlot = components['schemas']['PatternSlotDto'];
export type PatternPending = components['schemas']['PatternPendingDto'];
export type SchedulePatternRecord = components['schemas']['SchedulePatternRecordDto'];
export type SchedulePatternList = components['schemas']['SchedulePatternListResponseDto'];

// ── Notification Preferences ──
export type GroupPreference = components['schemas']['GroupPreferenceDto'];
export type NotificationPreferencesResponse = components['schemas']['NotificationPreferencesResponseDto'];
export type PushSubscriptionResponse = components['schemas']['PushSubscriptionResponseDto'];
export type PushSubscriptionList = components['schemas']['PushSubscriptionListResponseDto'];

// ── Paths (for openapi-fetch client) ──
export type { paths } from './api.gen';

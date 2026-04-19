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

// ── Image sub-types ──
export type CloudinaryImage = components['schemas']['CloudinaryImageDto'];
export type ImageObj = components['schemas']['ImageObjDto'];

// ── Backward-compatible aliases (still used across consumers) ──
export type IAuthUser = AuthUser;
export type IAuthSession = AuthSession;
export type IAccessToken = AccessToken;
export type IDevice = DeviceRecord;
export type IDevicePart = DevicePartRecord;
export type IUserDevice = UserDeviceRecord;
export type IArticle = ArticleResponse;
export type ICertificate = CertificateRecord;
export type IRepairer = RepairerRecord;
export type IReview = ReviewRecord;
export type IImageAttachment = ImageRecord;
export type IInvitationLink = InviteLinkResponse;
export type IRepairPayment = PaymentRecord;
export type IDealerProfile = DealerProfileRecord;
export type IDealerClient = DealerClientRecord;
export type IPointsTransaction = PointsTransactionRecord;
export type IPointsWithdrawal = WithdrawalRecord;

export type ProcessInvoiceResult = ProcessInvoice;
export type PaymentOptionsDto = PaymentOptions;
export type PaymentStatsDto = PaymentStats;

// ── Paths (for openapi-fetch client) ──
export type { paths } from './api.gen';

import { Observable } from 'rxjs';

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

// ─── Device Requests ────────────────────────────────────────────────────

export interface CreateDeviceRequest {
    name: string;
    type: string;
    model: string;
    brand: string;
    description: string;
    specifications: string;
    features: string;
}

export interface UpdateDeviceRequest {
    id: string;
    name: string;
    type: string;
    model: string;
    brand: string;
    price: number;
    description: string;
    specifications: string;
    features: string;
    slug: string;
    isFeatured: boolean;
}

export interface DeleteDeviceRequest {
    id: string;
}

export interface ImportDevicesRequest {
    productsJson: string;
}

export interface ImportDevicePartsRequest {
    partsJson: string;
}

export interface FindAllDevicesRequest {
    page: number;
    limit: number;
    search: string;
    type: string;
    isFeatured: boolean;
    sortBy: string;
    sortOrder: string;
}

export interface FindBySlugRequest {
    slug: string;
}

export interface FindByIdRequest {
    id: string;
}

export interface RegisterUserDeviceRequest {
    userId: string;
    deviceId: string;
    serialNumber: string;
    addressId: string;
    purchaseDate: string;
    warrantyUntil: string;
    notes: string;
}

export interface GetUserDevicesRequest {
    userId: string;
}

export interface GetUserDeviceRequest {
    userId: string;
    id: string;
}

export interface RemoveUserDeviceRequest {
    userId: string;
    id: string;
}

export interface UpdateUserDeviceRequest {
    userId: string;
    id: string;
    addressId: string;
    serialNumber: string;
    notes: string;
}

export interface CreateDevicePartRequest {
    deviceId: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
    group: string;
    categoryId: string;
}

export interface UpdateDevicePartRequest {
    id: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
    deviceId: string;
    group: string;
    categoryId: string;
}

export interface DeleteDevicePartRequest {
    id: string;
}

export interface GetDevicePartsRequest {
    deviceId: string;
}

export interface GetAllDevicePartsRequest {
    page: number;
    limit: number;
    search: string;
    deviceId: string;
    genericOnly: boolean;
    categoryId: string;
}

export interface CreateAddressRequest {
    country: string;
    city: string;
    street: string;
    house: number;
    building: number;
    floor: number;
    room: number;
    postalCode: string;
    latitude: number;
    longitude: number;
}

// ─── Device Responses ───────────────────────────────────────────────────

export interface DeleteAllResponse {
    deletedCount: number;
}

export interface ImportDevicesResponse {
    importedCount: number;
    imported: ImportedDeviceInfo[];
}

export interface ImportedDeviceInfo {
    id: string;
    imageUrls: string[];
}

export interface ImportDevicePartsResponse {
    importedCount: number;
    skippedCount: number;
}

export interface DeviceRecord {
    id: string;
    name: string;
    type: string;
    model: string;
    brand: string;
    price: number;
    description: string;
    specifications: string;
    features: string;
    slug: string;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
    categoryId: string;
    categoryName: string;
    categoryLabel: string;
}

export interface DeviceResponse {
    device: DeviceRecord;
}

export interface DevicePriceResponse {
    price: number;
}

export interface PaginatedDevicesResponse {
    data: DeviceRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface AddressRecord {
    id: string;
    country: string;
    city: string;
    street: string;
    house: number;
    building: number;
    floor: number;
    room: number;
    postalCode: string;
    latitude: number;
    longitude: number;
    validationStatus: string;
    validationError: string;
}

export interface AddressResponse {
    address: AddressRecord;
}

export interface AddressListResponse {
    addresses: AddressRecord[];
}

export interface DevicePartRecord {
    id: string;
    deviceId: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
    createdAt: string;
    updatedAt: string;
    deviceName: string;
    group: string;
    categoryId: string;
    categoryName: string;
}

export interface DevicePartResponse {
    part: DevicePartRecord;
}

export interface DevicePartListResponse {
    parts: DevicePartRecord[];
}

export interface PaginatedDevicePartsResponse {
    parts: DevicePartRecord[];
    overallCount: number;
    page: number;
    limit: number;
}

export interface UserDeviceRecord {
    id: string;
    userId: string;
    deviceId: string;
    serialNumber: string;
    addressId: string;
    purchaseDate: string;
    warrantyUntil: string;
    notes: string;
    createdAt: string;
    device: DeviceRecord;
    address: AddressRecord;
    registrationSignature?: string;
    registrationSignedPayload?: string;
    validationStatus?: string;
    validationError?: string;
}

export interface UserDeviceResponse {
    userDevice: UserDeviceRecord;
}

export interface UserDeviceListResponse {
    userDevices: UserDeviceRecord[];
}

export interface EmptyDeviceRequest {}
export interface EmptyDeviceResponse {}

// ─── Device gRPC Service Interface ──────────────────────────────────────

export interface DeviceServiceClient {
    // Device catalog (admin)
    createDevice(request: CreateDeviceRequest): Observable<DeviceResponse>;
    updateDevice(request: UpdateDeviceRequest): Observable<DeviceResponse>;
    deleteDevice(request: DeleteDeviceRequest): Observable<EmptyDeviceResponse>;
    deleteAllDevices(request: EmptyDeviceRequest): Observable<DeleteAllResponse>;
    importDevices(request: ImportDevicesRequest): Observable<ImportDevicesResponse>;

    // Device catalog (public)
    findAllDevices(request: FindAllDevicesRequest): Observable<PaginatedDevicesResponse>;
    findDeviceBySlug(request: FindBySlugRequest): Observable<DeviceResponse>;
    findDeviceById(request: FindByIdRequest): Observable<DeviceResponse>;
    getDevicePrice(request: FindByIdRequest): Observable<DevicePriceResponse>;

    // User devices
    registerUserDevice(request: RegisterUserDeviceRequest): Observable<UserDeviceResponse>;
    updateUserDevice(request: UpdateUserDeviceRequest): Observable<UserDeviceResponse>;
    getUserDevices(request: GetUserDevicesRequest): Observable<UserDeviceListResponse>;
    getUserDevice(request: GetUserDeviceRequest): Observable<UserDeviceResponse>;
    removeUserDevice(request: RemoveUserDeviceRequest): Observable<EmptyDeviceResponse>;
    findUserDeviceById(request: FindByIdRequest): Observable<UserDeviceResponse>;

    // Device parts
    createDevicePart(request: CreateDevicePartRequest): Observable<DevicePartResponse>;
    updateDevicePart(request: UpdateDevicePartRequest): Observable<DevicePartResponse>;
    deleteDevicePart(request: DeleteDevicePartRequest): Observable<EmptyDeviceResponse>;
    getDeviceParts(request: GetDevicePartsRequest): Observable<DevicePartListResponse>;
    getAllDeviceParts(request: GetAllDevicePartsRequest): Observable<PaginatedDevicePartsResponse>;
    importDeviceParts(request: ImportDevicePartsRequest): Observable<ImportDevicePartsResponse>;

    // Address
    createAddress(request: CreateAddressRequest): Observable<AddressResponse>;
    findAddressById(request: FindByIdRequest): Observable<AddressResponse>;
    findAllAddresses(request: EmptyDeviceRequest): Observable<AddressListResponse>;

    // Device categories
    findAllDeviceCategories(request: EmptyDeviceRequest): Observable<DeviceCategoryListResponse>;
    findDeviceCategoryById(request: FindByIdRequest): Observable<DeviceCategoryResponse>;
    createDeviceCategory(request: CreateDeviceCategoryRequest): Observable<DeviceCategoryResponse>;
    updateDeviceCategory(request: UpdateDeviceCategoryRequest): Observable<DeviceCategoryResponse>;
    deleteDeviceCategory(request: DeleteDeviceCategoryRequest): Observable<EmptyDeviceResponse>;
}

// ─── Device Category Interfaces ────────────────────────────────────────

export interface DeviceCategoryRecord {
    id: string;
    name: string;
    label: string;
    labelPlural: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDeviceCategoryRequest {
    name: string;
    label: string;
    labelPlural: string;
    order: number;
}

export interface UpdateDeviceCategoryRequest {
    id: string;
    name: string;
    label: string;
    labelPlural: string;
    order: number;
}

export interface DeleteDeviceCategoryRequest {
    id: string;
}

export interface DeviceCategoryResponse {
    category: DeviceCategoryRecord;
}

export interface DeviceCategoryListResponse {
    categories: DeviceCategoryRecord[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICATE DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

// ─── Certificate Records ────────────────────────────────────────────────

export interface CertificateRecord {
    id: string;
    userId: string;
    userDeviceId: string;
    dealerId: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string;
    price: number;
    paid: boolean;
    purchaseReceiptUrl: string;
    description: string;
    createdAt: string;
    signature?: string;
    signedPayload?: string;
    pdfDocumentId?: string;
}

export interface CertificateSnapshotRecord {
    id: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string;
    frozenAt: string;
    signedPayload?: string;
    signature?: string;
}

// ─── Certificate Requests ───────────────────────────────────────────────

export interface CertAddCertificateRequest {
    userId: string;
    userDeviceId: string;
    certificateNumber: string;
    expiresAt: string;
}

export interface CertCreateByDealerRequest {
    clientUserId: string;
    userDeviceId: string;
    dealerId: string;
    expiresAt: string;
    purchaseReceiptUrl: string;
    description: string;
    serialNumber: string;
}

export interface CertSelfCreateRequest {
    userId: string;
    userDeviceId: string;
    expiresAt: string;
    description: string;
}

export interface CertMarkPaidRequest {
    id: string;
}

export interface CertRevokeRequest {
    id: string;
}

export interface CertReassignRequest {
    userId: string;
    certId: string;
    userDeviceId: string;
}

export interface CertReapplyRequest {
    userId: string;
    sourceCertId: string;
    durationMonths: number;
    description: string;
}

export interface CertDismissReminderRequest {
    userId: string;
    certId: string;
}

export interface CertCalculatePriceRequest {
    userDeviceId: string;
    expiresAt: string;
}

export interface CertFindByIdRequest {
    id: string;
}

export interface CertFindByUserRequest {
    userId: string;
}

export interface CertFindByDealerRequest {
    dealerId: string;
    page: number;
    limit: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
    dateFrom: string;
    dateTo: string;
}

export interface CertFindAllRequest {
    page: number;
    limit: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
    dateFrom: string;
    dateTo: string;
}

export interface CertValidateRequest {
    certificateNumber: string;
}

// ─── Certificate Responses ──────────────────────────────────────────────

export interface CertificateResponse {
    certificate: CertificateRecord;
}

export interface CertificateListResponse {
    certificates: CertificateRecord[];
}

export interface PaginatedCertificatesResponse {
    data: CertificateRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface CertPriceResponse {
    price: number;
}

export interface CertValidateResponse {
    valid: boolean;
    certificate: CertificateRecord;
}

// ─── Certificate PDF ────────────────────────────────────────────────────

export interface GenerateCertificatePdfRequest {
    certId: string;
    deviceName: string;
    deviceBrand: string;
    deviceModel: string;
    deviceDescription: string;
    deviceImage: Uint8Array;
    deviceImageMimetype: string;
}

export interface GenerateCertificatePdfResponse {
    pdfBuffer: Uint8Array;
    certId: string;
}

export interface SetCertPdfDocIdRequest {
    certId: string;
    documentId: string;
}

// ─── Certificate gRPC Service Interface ─────────────────────────────────

export interface CertificateServiceClient {
    addCertificate(request: CertAddCertificateRequest): Observable<CertificateResponse>;
    createByDealer(request: CertCreateByDealerRequest): Observable<CertificateResponse>;
    selfCreate(request: CertSelfCreateRequest): Observable<CertificateResponse>;
    markPaid(request: CertMarkPaidRequest): Observable<CertificateResponse>;
    revokeCertificate(request: CertRevokeRequest): Observable<CertificateResponse>;
    reassignCertificate(request: CertReassignRequest): Observable<CertificateResponse>;
    reapplyCertificate(request: CertReapplyRequest): Observable<CertificateResponse>;
    dismissExpiryReminder(request: CertDismissReminderRequest): Observable<CertificateResponse>;
    calculatePrice(request: CertCalculatePriceRequest): Observable<CertPriceResponse>;
    findById(request: CertFindByIdRequest): Observable<CertificateResponse>;
    findByUser(request: CertFindByUserRequest): Observable<CertificateListResponse>;
    findByDealer(request: CertFindByDealerRequest): Observable<PaginatedCertificatesResponse>;
    findAll(request: CertFindAllRequest): Observable<PaginatedCertificatesResponse>;
    validateCertificate(request: CertValidateRequest): Observable<CertValidateResponse>;
    verifySignature(request: VerifySignatureRequest): Observable<VerifySignatureResponse>;
    getPublicKey(request: SignatureEmptyRequest): Observable<PublicKeyResponse>;
    generateCertificatePdf(request: GenerateCertificatePdfRequest): Observable<GenerateCertificatePdfResponse>;
    setCertificatePdfDocumentId(request: SetCertPdfDocIdRequest): Observable<CertificateResponse>;
}

// ═══════════════════════════════════════════════════════════════════════════
// REPAIRER DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

// ─── Repairer Records ───────────────────────────────────────────────────

export interface RepairerRecord {
    id: string;
    userId: string;
    specializations: string[];
    city: string;
    isActive: boolean;
    completedRepairs: number;
    latitude: number;
    longitude: number;
    lastLocationUpdate: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewRecord {
    id: string;
    repairRequestId: string;
    userId: string;
    repairerId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// ─── Repairer Requests ──────────────────────────────────────────────────

export interface CreateRepairerRequest {
    userId: string;
    city: string;
    specializations: string[];
}

export interface UpdateRepairerRequest {
    id: string;
    city: string;
    specializations: string[];
    isActive: boolean;
}

export interface UpdateLocationRequest {
    userId: string;
    latitude: number;
    longitude: number;
}

export interface UpdateLastLocationRequest {
    id: string;
    latitude: number;
    longitude: number;
}

export interface RepairerGetByUserIdRequest {
    userId: string;
}

export interface RepairerFindByIdRequest {
    id: string;
}

export interface FindAllRepairersRequest {
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: string;
}

export interface FindInCityRequest {
    city: string;
}

export interface CreateReviewRequest {
    repairRequestId: string;
    userId: string;
    rating: number;
    comment: string;
}

export interface FindReviewsByRepairerRequest {
    repairerId: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface FindUserReviewRequest {
    userId: string;
    reviewId: string;
}

// ─── Repairer Responses ─────────────────────────────────────────────────

export interface EmptyRepairerRequest {}
export interface EmptyRepairerResponse {}

export interface RepairerResponse {
    repairer: RepairerRecord;
}

export interface RepairerListResponse {
    repairers: RepairerRecord[];
}

export interface PaginatedRepairersResponse {
    data: RepairerRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface ReviewResponse {
    review: ReviewRecord;
}

export interface ReviewListResponse {
    reviews: ReviewRecord[];
}

export interface PaginatedReviewsResponse {
    data: ReviewRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface RatingResponse {
    average: number;
    count: number;
}

// ─── Repairer gRPC Service Interface ────────────────────────────────────

export interface RepairerServiceClient {
    // Repairer CRUD
    createRepairer(request: CreateRepairerRequest): Observable<RepairerResponse>;
    updateRepairer(request: UpdateRepairerRequest): Observable<RepairerResponse>;
    updateLocation(request: UpdateLocationRequest): Observable<RepairerResponse>;
    getMyProfile(request: RepairerGetByUserIdRequest): Observable<RepairerResponse>;
    findAllRepairers(request: FindAllRepairersRequest): Observable<PaginatedRepairersResponse>;
    findRepairerById(request: RepairerFindByIdRequest): Observable<RepairerResponse>;
    findByUserId(request: RepairerGetByUserIdRequest): Observable<RepairerResponse>;
    findActiveInCity(request: FindInCityRequest): Observable<RepairerListResponse>;
    incrementCompleted(request: RepairerFindByIdRequest): Observable<EmptyRepairerResponse>;
    updateLastLocation(request: UpdateLastLocationRequest): Observable<EmptyRepairerResponse>;

    // Reviews
    createReview(request: CreateReviewRequest): Observable<ReviewResponse>;
    findReviewsByRepairer(request: FindReviewsByRepairerRequest): Observable<PaginatedReviewsResponse>;
    getRepairerRating(request: RepairerFindByIdRequest): Observable<RatingResponse>;
    findReviewsByUser(request: RepairerGetByUserIdRequest): Observable<ReviewListResponse>;
    findUserReview(request: FindUserReviewRequest): Observable<ReviewResponse>;
    findReviewByRequest(request: RepairerFindByIdRequest): Observable<ReviewResponse>;
}

// ═══════════════════════════════════════════════════════════════════════════
// REPAIR DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

// ─── Repair Records ─────────────────────────────────────────────────────

export interface RepairRequestRecord {
    id: string;
    userId: string;
    userDeviceId: string;
    repairerId: string;
    managerId: string;
    certificateId: string;
    addressId: string;
    status: string;
    description: string;
    preferredDate: string;
    totalCost: number;
    refundRequested: boolean;
    refundReason: string;
    refuseReason: string;
    completionNote: string;
    stepsLocked: boolean;
    createdAt: string;
    updatedAt: string;
    statusBeforePause: string;
    conversationId: string;
    chatCloseAt: string;
    completionSignature?: string;
    completionSignedPayload?: string;
    acceptanceSignature?: string;
    acceptanceSignedPayload?: string;
    certificateValid?: boolean;
    certificateSnapshot?: CertificateSnapshotRecord;
    avrStatus?: string;
    avrSigningMethod?: string;
    avrDocumentId?: string;
    avrSignedDocumentId?: string;
    avrSignedAt?: string;
    avrSignedPayload?: string;
    avrSignature?: string;
    statusTimestamps?: string;
    scheduleEndNotifiedAt?: string;
    scheduleEndConfirmedAt?: string;
}

export interface BrokenPartRecord {
    id: string;
    repairRequestId: string;
    devicePartId: string;
    name: string;
    status: string;
    note: string;
    createdAt: string;
    updatedAt: string;
    externalOrderId: string;
    supplierProvider: string;
    orderedAt: string;
    isSuggestion: boolean;
}

export interface BrokenPartInput {
    devicePartId: string;
    name: string;
    note: string;
}

export interface WorkStepRecord {
    id: string;
    repairRequestId: string;
    title: string;
    description: string;
    status: string;
    order: number;
    isFinal: boolean;
    createdAt: string;
    updatedAt: string;
    isMandatory: boolean;
    comment: string;
    declinedAt: string;
    declinedByRepairerId: string;
    completedByRepairerId: string;
}

// ─── Repair Requests ────────────────────────────────────────────────────

export interface RepairCreateRequest {
    userId: string;
    userDeviceId: string;
    description: string;
    certificateId: string;
    preferredDate: string;
    brokenParts: BrokenPartInput[];
}

export interface RepairCancelRequest {
    userId: string;
    requestId: string;
}

export interface RepairRequestRefundRequest {
    userId: string;
    requestId: string;
    reason: string;
}

export interface RepairAssignRepairerRequest {
    managerId: string;
    requestId: string;
    repairerId: string;
}

export interface RepairAcceptRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairDepartRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairRefuseRequest {
    repairerUserId: string;
    requestId: string;
    reason: string;
}

export interface RepairStartWorkRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairSetPriceRequest {
    repairerUserId: string;
    requestId: string;
    amount: number;
}

export interface RepairMarkAwaitingCompletionRequest {
    requestId: string;
}

export interface RepairCompleteRequest {
    requestId: string;
    description: string;
}

// ─── AVR Interfaces ────────────────────────────────────────────────────────

export interface GenerateAvrRequest {
    repairerUserId: string;
    requestId: string;
    completionNote: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    repairerName: string;
}

export interface GenerateAvrResponse {
    pdfBuffer: Uint8Array;
    requestId: string;
    avrStatus: string;
}

export interface ResetAvrRequest {
    repairerUserId: string;
    requestId: string;
}

export interface SetAvrDocumentIdRequest {
    requestId: string;
    documentId: string;
}

export interface SetAvrPendingSignatureRequest {
    requestId: string;
}

export interface SignAvrDigitalRequest {
    requestId: string;
    userId: string;
}

export interface UploadAvrScanRequest {
    requestId: string;
    repairerUserId: string;
    signedDocumentId: string;
}

// ───────────────────────────────────────────────────────────────────────────

export interface RepairApproveRefundRequest {
    requestId: string;
}

export interface RepairDenyRefundRequest {
    requestId: string;
}

export interface RepairPauseRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairResumeRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairConfirmSchedulePresenceRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairReassignRepairerRequest {
    managerId: string;
    requestId: string;
    newRepairerId: string;
}

export interface RepairFindPausedByRepairerRequest {
    repairerUserId: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface RepairAddStepRequest {
    repairerUserId: string;
    requestId: string;
    title: string;
    description: string;
    order: number;
    isFinal: boolean;
    comment: string;
    isMandatory: boolean;
}

export interface RepairUpdateStepRequest {
    repairerUserId: string;
    requestId: string;
    stepId: string;
    title: string;
    description: string;
    status: string;
    comment: string;
}

export interface RepairApproveDiagnosticsRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairDeclineDiagnosticsRequest {
    repairerUserId: string;
    requestId: string;
    reason: string;
}

export interface RepairCompleteStepRequest {
    repairerUserId: string;
    requestId: string;
    stepId: string;
}

export interface RepairDeleteStepRequest {
    repairerUserId: string;
    requestId: string;
    stepId: string;
}

export interface RepairLockStepsRequest {
    repairerUserId: string;
    requestId: string;
}

export interface RepairGetStepsRequest {
    requestId: string;
}

export interface RepairAddBrokenPartRequest {
    userId: string;
    requestId: string;
    devicePartId: string;
    name: string;
    note: string;
    isSuggestion: boolean;
}

export interface RepairUpdateBrokenPartRequest {
    userId: string;
    requestId: string;
    partId: string;
    name: string;
    note: string;
}

export interface RepairUpdateBrokenPartStatusRequest {
    userId: string;
    requestId: string;
    partId: string;
    status: string;
}

export interface RepairDeleteBrokenPartRequest {
    userId: string;
    requestId: string;
    partId: string;
}

export interface RepairGetBrokenPartsRequest {
    requestId: string;
}

export interface RepairOrderBrokenPartRequest {
    userId: string;
    requestId: string;
    partId: string;
    supplier: string;
}

export interface RepairFindByIdRequest {
    id: string;
}

export interface RepairFindByUserRequest {
    userId: string;
    page: number;
    limit: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
    dateFrom: string;
    dateTo: string;
}

export interface RepairFindByRepairerRequest {
    repairerUserId: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface RepairFindByRepairerFilteredRequest {
    repairerUserId: string;
    page: number;
    limit: number;
    status: string;
    search: string;
    sortBy: string;
    sortOrder: string;
    dateFrom: string;
    dateTo: string;
}

export interface RepairFindActiveByRepairerRequest {
    repairerUserId: string;
}

export interface RepairFindAllRequest {
    page: number;
    limit: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
    dateFrom: string;
    dateTo: string;
}

export interface RepairCheckActiveForDeviceRequest {
    userDeviceId: string;
}

export interface RepairSetConversationIdRequest {
    requestId: string;
    conversationId: string;
}

export interface RepairFindOpenChatsRequest {}

export interface RepairOpenChatsResponse {
    chats: RepairOpenChatRecord[];
}

export interface RepairOpenChatRecord {
    requestId: string;
    conversationId: string;
}

export interface RepairClearChatCloseAtRequest {
    requestId: string;
}

export interface RepairClearChatCloseAtResponse {
    conversationId: string;
}

// ─── Repair Responses ───────────────────────────────────────────────────

export interface RepairEmptyResponse {}

export interface RepairRequestResponse {
    request: RepairRequestRecord;
}

export interface PaginatedRepairRequestsResponse {
    data: RepairRequestRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface WorkStepResponse {
    step: WorkStepRecord;
}

export interface WorkStepListResponse {
    steps: WorkStepRecord[];
}

export interface CompleteStepResponse {
    step: WorkStepRecord;
    requestCompleted: boolean;
}

export interface BrokenPartResponse {
    part: BrokenPartRecord;
}

export interface BrokenPartListResponse {
    parts: BrokenPartRecord[];
}

export interface RepairCheckActiveResponse {
    hasActive: boolean;
    request: RepairRequestRecord;
}

// ─── Repair gRPC Service Interface ──────────────────────────────────────

export interface RepairServiceClient {
    // Repair request lifecycle
    createRequest(request: RepairCreateRequest): Observable<RepairRequestResponse>;
    cancelRequest(request: RepairCancelRequest): Observable<RepairRequestResponse>;
    requestRefund(request: RepairRequestRefundRequest): Observable<RepairRequestResponse>;
    assignRepairer(request: RepairAssignRepairerRequest): Observable<RepairRequestResponse>;
    acceptRequest(request: RepairAcceptRequest): Observable<RepairRequestResponse>;
    depart(request: RepairDepartRequest): Observable<RepairRequestResponse>;
    refuseRequest(request: RepairRefuseRequest): Observable<RepairRequestResponse>;
    startWork(request: RepairStartWorkRequest): Observable<RepairRequestResponse>;
    setPrice(request: RepairSetPriceRequest): Observable<RepairRequestResponse>;
    markAwaitingCompletion(request: RepairMarkAwaitingCompletionRequest): Observable<RepairEmptyResponse>;
    complete(request: RepairCompleteRequest): Observable<RepairRequestResponse>;
    approveRefund(request: RepairApproveRefundRequest): Observable<RepairRequestResponse>;
    denyRefund(request: RepairDenyRefundRequest): Observable<RepairRequestResponse>;
    pauseRequest(request: RepairPauseRequest): Observable<RepairRequestResponse>;
    resumeRequest(request: RepairResumeRequest): Observable<RepairRequestResponse>;
    confirmSchedulePresence(request: RepairConfirmSchedulePresenceRequest): Observable<RepairRequestResponse>;
    reassignRepairer(request: RepairReassignRepairerRequest): Observable<RepairRequestResponse>;
    acceptCompletion(request: RepairAcceptCompletionRequest): Observable<RepairRequestResponse>;

    // AVR (Work Completion Act)
    generateAvr(request: GenerateAvrRequest): Observable<GenerateAvrResponse>;
    resetAvr(request: ResetAvrRequest): Observable<RepairRequestResponse>;
    setAvrDocumentId(request: SetAvrDocumentIdRequest): Observable<RepairRequestResponse>;
    setAvrPendingSignature(request: SetAvrPendingSignatureRequest): Observable<RepairRequestResponse>;
    signAvrDigital(request: SignAvrDigitalRequest): Observable<RepairRequestResponse>;
    uploadAvrScan(request: UploadAvrScanRequest): Observable<RepairRequestResponse>;

    // Work steps
    addStep(request: RepairAddStepRequest): Observable<WorkStepResponse>;
    updateStep(request: RepairUpdateStepRequest): Observable<WorkStepResponse>;
    completeStep(request: RepairCompleteStepRequest): Observable<CompleteStepResponse>;
    deleteStep(request: RepairDeleteStepRequest): Observable<RepairEmptyResponse>;
    lockSteps(request: RepairLockStepsRequest): Observable<RepairRequestResponse>;
    getSteps(request: RepairGetStepsRequest): Observable<WorkStepListResponse>;
    approveDiagnostics(request: RepairApproveDiagnosticsRequest): Observable<RepairEmptyResponse>;
    declineDiagnostics(request: RepairDeclineDiagnosticsRequest): Observable<WorkStepListResponse>;

    // Broken parts
    addBrokenPart(request: RepairAddBrokenPartRequest): Observable<BrokenPartResponse>;
    updateBrokenPart(request: RepairUpdateBrokenPartRequest): Observable<BrokenPartResponse>;
    updateBrokenPartStatus(request: RepairUpdateBrokenPartStatusRequest): Observable<BrokenPartResponse>;
    deleteBrokenPart(request: RepairDeleteBrokenPartRequest): Observable<RepairEmptyResponse>;
    getBrokenParts(request: RepairGetBrokenPartsRequest): Observable<BrokenPartListResponse>;
    orderBrokenPart(request: RepairOrderBrokenPartRequest): Observable<BrokenPartResponse>;

    // Queries
    findById(request: RepairFindByIdRequest): Observable<RepairRequestResponse>;
    findByUser(request: RepairFindByUserRequest): Observable<PaginatedRepairRequestsResponse>;
    findByRepairer(request: RepairFindByRepairerRequest): Observable<PaginatedRepairRequestsResponse>;
    findByRepairerFiltered(request: RepairFindByRepairerFilteredRequest): Observable<PaginatedRepairRequestsResponse>;
    findActiveByRepairer(request: RepairFindActiveByRepairerRequest): Observable<RepairRequestResponse>;
    findPausedByRepairer(request: RepairFindPausedByRepairerRequest): Observable<PaginatedRepairRequestsResponse>;
    findAll(request: RepairFindAllRequest): Observable<PaginatedRepairRequestsResponse>;
    checkActiveForDevice(request: RepairCheckActiveForDeviceRequest): Observable<RepairCheckActiveResponse>;

    // Chat
    setConversationId(request: RepairSetConversationIdRequest): Observable<RepairEmptyResponse>;
    findOpenChatsForClose(request: RepairFindOpenChatsRequest): Observable<RepairOpenChatsResponse>;
    clearChatCloseAt(request: RepairClearChatCloseAtRequest): Observable<RepairClearChatCloseAtResponse>;

    // Stats
    getRepairersActiveRequestCounts(request: RepairGetRepairersStatsRequest): Observable<RepairRepairersStatsResponse>;
    getCompletionMetrics(request: RepairCompletionMetricsRequest): Observable<RepairCompletionMetricsResponse>;
}

export interface RepairGetRepairersStatsRequest {
    repairerIds: string[];
}

export interface RepairerStatsRecord {
    repairerId: string;
    activeRequestCount: number;
    currentRequestStatus: string;
}

export interface RepairRepairersStatsResponse {
    stats: RepairerStatsRecord[];
}

export interface RepairCompletionMetricsRequest {
    dateFrom: string;
    dateTo: string;
}

export interface RepairCompletionMetricsResponse {
    dateFrom: string;
    dateTo: string;
    totalTerminal: number;
    completedCount: number;
    cancelledCount: number;
    refusedCount: number;
    refundedCount: number;
    avgTotalMinutes: number;
    avgActiveWorkMinutes: number;
    avgAssignmentMinutes: number;
    avgResponseMinutes: number;
    avgTravelMinutes: number;
    avgRepairMinutes: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEALER DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

// ─── Dealer Records ─────────────────────────────────────────────────────

export interface DealerProfileRecord {
    id: string;
    userId: string;
    companyName: string;
    inn: string;
    pointsBalance: number;
    createdAt: string;
    updatedAt: string;
    agreementSignature?: string;
    agreementSignedPayload?: string;
}

export interface DealerClientRecord {
    id: string;
    dealerId: string;
    clientUserId: string;
    createdAt: string;
}

export interface PointsTransactionRecord {
    id: string;
    dealerId: string;
    type: string;
    amount: number;
    reason: string;
    repairRequestId: string;
    createdAt: string;
}

export interface WithdrawalRecord {
    id: string;
    dealerId: string;
    amount: number;
    status: string;
    requestedAt: string;
    processedAt: string;
    processedByUserId: string;
    cardNumber: string;
    cardHolderName: string;
}

export interface DealerUserDeviceRecord {
    id: string;
    userId: string;
    deviceId: string;
    serialNumber: string;
    deviceName: string;
    deviceModel: string;
    deviceBrand: string;
}

// ─── Dealer Requests ────────────────────────────────────────────────────

export interface CreateDealerProfileRequest {
    userId: string;
    companyName: string;
    inn: string;
}

export interface UpdateDealerProfileRequest {
    userId: string;
    companyName: string;
    inn: string;
}

export interface DealerGetByUserIdRequest {
    userId: string;
}

export interface AddClientRequest {
    dealerUserId: string;
    clientUserId: string;
}

export interface LinkClientRequest {
    dealerId: string;
    clientUserId: string;
}

export interface AwardPointsRequest {
    dealerId: string;
    certificatePrice: number;
    certificateNumber: string;
}

export interface DealerPointsHistoryRequest {
    userId: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface RequestWithdrawalRequest {
    userId: string;
    amount: number;
    cardNumber: string;
    cardHolderName: string;
}

export interface ProcessWithdrawalRequest {
    withdrawalId: string;
    adminUserId: string;
    status: string;
}

export interface DealerPaginationRequest {
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: string;
}

export interface DealerFindByIdRequest {
    id: string;
}

// ─── Dealer Responses ───────────────────────────────────────────────────

export interface DealerEmptyResponse {}

export interface DealerProfileResponse {
    profile: DealerProfileRecord;
}

export interface DealerClientResponse {
    client: DealerClientRecord;
}

export interface DealerClientListResponse {
    clients: DealerClientRecord[];
}

export interface DealerUserDeviceListResponse {
    devices: DealerUserDeviceRecord[];
}

export interface PaginatedPointsResponse {
    data: PointsTransactionRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface WithdrawalResponse {
    withdrawal: WithdrawalRecord;
}

export interface WithdrawalListResponse {
    withdrawals: WithdrawalRecord[];
}

export interface PaginatedWithdrawalsResponse {
    data: WithdrawalRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

export interface WithdrawalPayoutResponse {
    amount: number;
    dealerUserId: string;
    cardNumber: string;
    cardHolderName: string;
}

export interface PaginatedDealersResponse {
    data: DealerProfileRecord[];
    overallCount: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}

// ─── Dealer gRPC Service Interface ──────────────────────────────────────

export interface DealerServiceClient {
    createProfile(request: CreateDealerProfileRequest): Observable<DealerProfileResponse>;
    updateProfile(request: UpdateDealerProfileRequest): Observable<DealerProfileResponse>;
    getProfile(request: DealerGetByUserIdRequest): Observable<DealerProfileResponse>;
    addClient(request: AddClientRequest): Observable<DealerClientResponse>;
    linkClientOnCertificateApproval(request: LinkClientRequest): Observable<DealerEmptyResponse>;
    awardPointsForCertificate(request: AwardPointsRequest): Observable<DealerEmptyResponse>;
    getClients(request: DealerGetByUserIdRequest): Observable<DealerClientListResponse>;
    getUserDevicesForCertificate(request: DealerGetByUserIdRequest): Observable<DealerUserDeviceListResponse>;
    getPointsHistory(request: DealerPointsHistoryRequest): Observable<PaginatedPointsResponse>;
    requestWithdrawal(request: RequestWithdrawalRequest): Observable<WithdrawalResponse>;
    processWithdrawal(request: ProcessWithdrawalRequest): Observable<WithdrawalResponse>;
    getWithdrawals(request: DealerGetByUserIdRequest): Observable<WithdrawalListResponse>;
    getAllWithdrawals(request: DealerPaginationRequest): Observable<PaginatedWithdrawalsResponse>;
    getWithdrawalForPayout(request: DealerFindByIdRequest): Observable<WithdrawalPayoutResponse>;
    completeWithdrawal(request: DealerFindByIdRequest): Observable<DealerEmptyResponse>;
    findAllDealers(request: DealerPaginationRequest): Observable<PaginatedDealersResponse>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGNATURE DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

export interface RepairAcceptCompletionRequest {
    userId: string;
    requestId: string;
}

export interface VerifySignatureRequest {
    entityType: string;
    entityId: string;
}

export interface VerifySignatureResponse {
    valid: boolean;
    reason: string;
    signedPayload: string;
}

export interface PublicKeyResponse {
    publicKeyPem: string;
    algorithm: string;
}

export interface SignatureEmptyRequest {}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

export interface ScheduleRecord {
    id: string;
    userId: string;
    type: string;
    dateFrom: string;
    dateTo: string;
    startTime: string;
    endTime: string;
    status: string;
    approvedBy: string;
    note: string;
    autoGenerated: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateScheduleRequest {
    userId: string;
    type: string;
    dateFrom: string;
    dateTo: string;
    startTime: string;
    endTime: string;
    note?: string;
    actorId?: string;
}

export interface UpdateScheduleRequest {
    id: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    note?: string;
    actorId?: string;
}

export interface FindAllSchedulesRequest {
    page?: number;
    limit?: number;
    userId?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface ScheduleFindByIdRequest {
    id: string;
}

export interface ScheduleDeleteRequest {
    id: string;
    actorId?: string;
}

export interface ScheduleApproveRequest {
    id: string;
    approvedBy: string;
}

export interface ScheduleEmptyResponse {}

export interface ScheduleResponse {
    schedule: ScheduleRecord;
}

export interface ScheduleListResponse {
    data: ScheduleRecord[];
}

export interface SchedulePaginatedResponse {
    data: ScheduleRecord[];
    overallCount: number;
    page: number;
    limit: number;
}

export interface ScheduleServiceClient {
    createSchedule(data: CreateScheduleRequest): Observable<ScheduleResponse>;
    updateSchedule(data: UpdateScheduleRequest): Observable<ScheduleResponse>;
    findAllSchedules(data: FindAllSchedulesRequest): Observable<SchedulePaginatedResponse>;
    findScheduleById(data: ScheduleFindByIdRequest): Observable<ScheduleResponse>;
    deleteSchedule(data: ScheduleDeleteRequest): Observable<ScheduleEmptyResponse>;
    approveSchedule(data: ScheduleApproveRequest): Observable<ScheduleResponse>;
    rejectSchedule(data: ScheduleApproveRequest): Observable<ScheduleResponse>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE PATTERN DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

export interface PatternSlot {
    work: boolean;
    startTime: string;
    endTime: string;
}

export interface PatternPending {
    cycleLength: number;
    anchorDate: string;
    defaultStartTime: string;
    defaultEndTime: string;
    slots: PatternSlot[];
}

export interface PatternRecord {
    id: string;
    userId: string;
    cycleLength: number;
    anchorDate: string;
    defaultStartTime: string;
    defaultEndTime: string;
    slots: PatternSlot[];
    createdAt: string;
    updatedAt: string;
    status: string;
    approvedBy: string;
    approvedAt: string;
    pendingData?: PatternPending;
    hasPendingData: boolean;
}

export interface GetPatternRequest {
    userId: string;
}

export interface UpsertPatternRequest {
    userId: string;
    cycleLength: number;
    anchorDate: string;
    defaultStartTime: string;
    defaultEndTime: string;
    slots: PatternSlot[];
    actorId: string;
    actorIsStaff: boolean;
}

export interface PatternApproveRequest {
    userId: string;
    approvedBy: string;
}

export interface DeletePatternRequest {
    userId: string;
    actorId?: string;
}

export interface GetManyPatternsRequest {
    userIds: string[];
}

export interface PatternResponse {
    pattern: PatternRecord;
}

export interface PatternListResponse {
    data: PatternRecord[];
}

export interface PatternHistoryRecord {
    id: string;
    patternId: string;
    userId: string;
    cycleLength: number;
    anchorDate: string;
    defaultStartTime: string;
    defaultEndTime: string;
    slots: PatternSlot[];
    status: string;
    pendingData?: PatternPending;
    changeType: string;
    changedBy?: string;
    isActive: boolean;
    effectiveFrom: string;
    changedAt: string;
}

export interface GetPatternHistoryRequest {
    userId: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface PatternHistoryResponse {
    data: PatternHistoryRecord[];
    overallCount: number;
    page: number;
    limit: number;
}

export interface GetScheduleReportRequest {
    userId: string;
    dateFrom: string;
    dateTo: string;
}

export interface ScheduleAggregateReportResponse {
    userId: string;
    dateFrom: string;
    dateTo: string;
    isCurrentlyActive: boolean;
    totalDays: number;
    activeDays: number;
    inactiveDays: number;
    workDays: number;
    restDays: number;
    noPatternDays: number;
    vacationDays: number;
    sickLeaveDays: number;
    overtimeCount: number;
    overtimeTotalMinutes: number;
    extraDayCount: number;
    patternRevisions: number;
}

export interface SchedulePatternServiceClient {
    getPattern(data: GetPatternRequest): Observable<PatternResponse>;
    upsertPattern(data: UpsertPatternRequest): Observable<PatternResponse>;
    deletePattern(data: DeletePatternRequest): Observable<ScheduleEmptyResponse>;
    getManyPatterns(data: GetManyPatternsRequest): Observable<PatternListResponse>;
    approvePattern(data: PatternApproveRequest): Observable<PatternResponse>;
    rejectPattern(data: PatternApproveRequest): Observable<PatternResponse>;
    getPatternHistory(data: GetPatternHistoryRequest): Observable<PatternHistoryResponse>;
    getScheduleReport(data: GetScheduleReportRequest): Observable<ScheduleAggregateReportResponse>;
}

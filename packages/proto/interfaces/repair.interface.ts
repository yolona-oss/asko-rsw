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

export interface FindAllDevicesRequest {
    offset: number;
    limit: number;
    search: string;
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

export interface CreateDevicePartRequest {
    deviceId: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
}

export interface UpdateDevicePartRequest {
    id: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
}

export interface DeleteDevicePartRequest {
    id: string;
}

export interface GetDevicePartsRequest {
    deviceId: string;
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
}

// ─── Device Responses ───────────────────────────────────────────────────

export interface DeleteAllResponse {
    deletedCount: number;
}

export interface ImportDevicesResponse {
    importedCount: number;
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
    offset: number;
    limit: number;
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
}

export interface DevicePartResponse {
    part: DevicePartRecord;
}

export interface DevicePartListResponse {
    parts: DevicePartRecord[];
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
    getUserDevices(request: GetUserDevicesRequest): Observable<UserDeviceListResponse>;
    getUserDevice(request: GetUserDeviceRequest): Observable<UserDeviceResponse>;
    removeUserDevice(request: RemoveUserDeviceRequest): Observable<EmptyDeviceResponse>;
    findUserDeviceById(request: FindByIdRequest): Observable<UserDeviceResponse>;

    // Device parts
    createDevicePart(request: CreateDevicePartRequest): Observable<DevicePartResponse>;
    updateDevicePart(request: UpdateDevicePartRequest): Observable<DevicePartResponse>;
    deleteDevicePart(request: DeleteDevicePartRequest): Observable<EmptyDeviceResponse>;
    getDeviceParts(request: GetDevicePartsRequest): Observable<DevicePartListResponse>;

    // Address
    createAddress(request: CreateAddressRequest): Observable<AddressResponse>;
    findAddressById(request: FindByIdRequest): Observable<AddressResponse>;
    findAllAddresses(request: EmptyDeviceRequest): Observable<AddressListResponse>;
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
    offset: number;
    limit: number;
    search: string;
    status: string;
}

export interface CertFindAllRequest {
    offset: number;
    limit: number;
    search: string;
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
    offset: number;
    limit: number;
}

export interface CertPriceResponse {
    price: number;
}

export interface CertValidateResponse {
    valid: boolean;
    certificate: CertificateRecord;
}

// ─── Certificate gRPC Service Interface ─────────────────────────────────

export interface CertificateServiceClient {
    addCertificate(request: CertAddCertificateRequest): Observable<CertificateResponse>;
    createByDealer(request: CertCreateByDealerRequest): Observable<CertificateResponse>;
    markPaid(request: CertMarkPaidRequest): Observable<CertificateResponse>;
    revokeCertificate(request: CertRevokeRequest): Observable<CertificateResponse>;
    reassignCertificate(request: CertReassignRequest): Observable<CertificateResponse>;
    calculatePrice(request: CertCalculatePriceRequest): Observable<CertPriceResponse>;
    findById(request: CertFindByIdRequest): Observable<CertificateResponse>;
    findByUser(request: CertFindByUserRequest): Observable<CertificateListResponse>;
    findByDealer(request: CertFindByDealerRequest): Observable<PaginatedCertificatesResponse>;
    findAll(request: CertFindAllRequest): Observable<PaginatedCertificatesResponse>;
    validateCertificate(request: CertValidateRequest): Observable<CertValidateResponse>;
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
    offset: number;
    limit: number;
    search: string;
}

export interface FindInCityRequest {
    city: string;
}

export interface CreateReviewRequest {
    repairRequestId: string;
    userId: string;
    repairerId: string;
    rating: number;
    comment: string;
}

export interface FindReviewsByRepairerRequest {
    repairerId: string;
    offset: number;
    limit: number;
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
    offset: number;
    limit: number;
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
    offset: number;
    limit: number;
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
    rejectedRepairers: string;
    completionNote: string;
    stepsLocked: boolean;
    createdAt: string;
    updatedAt: string;
    statusBeforePause: string;
    conversationId: string;
    chatCloseAt: string;
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

export interface RepairReassignRepairerRequest {
    managerId: string;
    requestId: string;
    newRepairerId: string;
}

export interface RepairFindPausedByRepairerRequest {
    repairerUserId: string;
    offset: number;
    limit: number;
}

export interface RepairAddStepRequest {
    repairerUserId: string;
    requestId: string;
    title: string;
    description: string;
    order: number;
    isFinal: boolean;
}

export interface RepairUpdateStepRequest {
    repairerUserId: string;
    requestId: string;
    stepId: string;
    title: string;
    description: string;
    status: string;
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

export interface RepairFindByIdRequest {
    id: string;
}

export interface RepairFindByUserRequest {
    userId: string;
    offset: number;
    limit: number;
}

export interface RepairFindByRepairerRequest {
    repairerUserId: string;
    offset: number;
    limit: number;
}

export interface RepairFindByRepairerFilteredRequest {
    repairerUserId: string;
    offset: number;
    limit: number;
    status: string;
}

export interface RepairFindActiveByRepairerRequest {
    repairerUserId: string;
}

export interface RepairFindAllRequest {
    offset: number;
    limit: number;
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
    offset: number;
    limit: number;
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
    refuseRequest(request: RepairRefuseRequest): Observable<RepairRequestResponse>;
    startWork(request: RepairStartWorkRequest): Observable<RepairRequestResponse>;
    setPrice(request: RepairSetPriceRequest): Observable<RepairRequestResponse>;
    markAwaitingCompletion(request: RepairMarkAwaitingCompletionRequest): Observable<RepairEmptyResponse>;
    complete(request: RepairCompleteRequest): Observable<RepairRequestResponse>;
    approveRefund(request: RepairApproveRefundRequest): Observable<RepairRequestResponse>;
    denyRefund(request: RepairDenyRefundRequest): Observable<RepairRequestResponse>;
    pauseRequest(request: RepairPauseRequest): Observable<RepairRequestResponse>;
    resumeRequest(request: RepairResumeRequest): Observable<RepairRequestResponse>;
    reassignRepairer(request: RepairReassignRepairerRequest): Observable<RepairRequestResponse>;

    // Work steps
    addStep(request: RepairAddStepRequest): Observable<WorkStepResponse>;
    updateStep(request: RepairUpdateStepRequest): Observable<WorkStepResponse>;
    completeStep(request: RepairCompleteStepRequest): Observable<CompleteStepResponse>;
    deleteStep(request: RepairDeleteStepRequest): Observable<RepairEmptyResponse>;
    lockSteps(request: RepairLockStepsRequest): Observable<RepairRequestResponse>;
    getSteps(request: RepairGetStepsRequest): Observable<WorkStepListResponse>;

    // Broken parts
    addBrokenPart(request: RepairAddBrokenPartRequest): Observable<BrokenPartResponse>;
    updateBrokenPart(request: RepairUpdateBrokenPartRequest): Observable<BrokenPartResponse>;
    updateBrokenPartStatus(request: RepairUpdateBrokenPartStatusRequest): Observable<BrokenPartResponse>;
    deleteBrokenPart(request: RepairDeleteBrokenPartRequest): Observable<RepairEmptyResponse>;
    getBrokenParts(request: RepairGetBrokenPartsRequest): Observable<BrokenPartListResponse>;

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
    offset: number;
    limit: number;
}

export interface RequestWithdrawalRequest {
    userId: string;
    amount: number;
}

export interface ProcessWithdrawalRequest {
    withdrawalId: string;
    adminUserId: string;
    status: string;
}

export interface DealerPaginationRequest {
    offset: number;
    limit: number;
    search: string;
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
    offset: number;
    limit: number;
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
    offset: number;
    limit: number;
}

export interface WithdrawalPayoutResponse {
    amount: number;
    dealerUserId: string;
}

export interface PaginatedDealersResponse {
    data: DealerProfileRecord[];
    overallCount: number;
    offset: number;
    limit: number;
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

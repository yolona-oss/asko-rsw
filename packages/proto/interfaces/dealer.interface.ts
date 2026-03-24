import { Observable } from 'rxjs';

// ─── Records ────────────────────────────────────────────────────────────

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

// ─── Requests ───────────────────────────────────────────────────────────

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

// ─── Responses ──────────────────────────────────────────────────────────

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

// ─── gRPC Service Interface ────────────────────────────────────────────

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

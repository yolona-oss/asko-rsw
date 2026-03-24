import { Observable } from 'rxjs';

// ─── Records ────────────────────────────────────────────────────────────

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

// ─── Requests ───────────────────────────────────────────────────────────

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

// ─── Responses ──────────────────────────────────────────────────────────

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

// ─── gRPC Service Interface ────────────────────────────────────────────

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
    findAll(request: RepairFindAllRequest): Observable<PaginatedRepairRequestsResponse>;
    checkActiveForDevice(request: RepairCheckActiveForDeviceRequest): Observable<RepairCheckActiveResponse>;
}

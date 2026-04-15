import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    RepairServiceClient,
    RepairRequestResponse,
    PaginatedRepairRequestsResponse,
    WorkStepResponse,
    WorkStepListResponse,
    CompleteStepResponse,
    RepairEmptyResponse,
    RepairCheckActiveResponse,
    RepairOpenChatsResponse,
    RepairClearChatCloseAtResponse,
    BrokenPartResponse,
    BrokenPartListResponse,
    RepairRepairersStatsResponse,
    RepairCompletionMetricsResponse,
    GenerateAvrResponse,
} from '@asko/proto';

@Injectable()
export class RepairClientService implements OnModuleInit {
    private repairService!: RepairServiceClient;

    constructor(
        @Inject('REPAIR_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.repairService = this.client.getService<RepairServiceClient>('RepairService');
    }

    // ── Repair request lifecycle ──

    createRequest(userId: string, dto: { userDeviceId: string; description: string; certificateId?: string; preferredDate?: string; brokenParts?: { devicePartId?: string; name?: string; note?: string }[] }): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.createRequest({
            userId,
            userDeviceId: dto.userDeviceId,
            description: dto.description,
            certificateId: dto.certificateId ?? '',
            preferredDate: dto.preferredDate ?? '',
            brokenParts: dto.brokenParts?.map(bp => ({
                devicePartId: bp.devicePartId ?? '',
                name: bp.name ?? '',
                note: bp.note ?? '',
            })) ?? [],
        }));
    }

    cancelRequest(userId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.cancelRequest({ userId, requestId }));
    }

    requestRefund(userId: string, requestId: string, reason: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.requestRefund({ userId, requestId, reason }));
    }

    assignRepairer(managerId: string, requestId: string, repairerId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.assignRepairer({ managerId, requestId, repairerId }));
    }

    acceptRequest(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.acceptRequest({ repairerUserId, requestId }));
    }

    depart(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.depart({ repairerUserId, requestId }));
    }

    refuseRequest(repairerUserId: string, requestId: string, reason: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.refuseRequest({ repairerUserId, requestId, reason }));
    }

    startWork(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.startWork({ repairerUserId, requestId }));
    }

    setPrice(repairerUserId: string, requestId: string, amount: number): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.setPrice({ repairerUserId, requestId, amount }));
    }

    markAwaitingCompletion(requestId: string): Promise<RepairEmptyResponse> {
        return grpcCall(this.repairService.markAwaitingCompletion({ requestId }));
    }

    complete(requestId: string, description?: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.complete({ requestId, description: description ?? '' }));
    }

    approveRefund(requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.approveRefund({ requestId }));
    }

    denyRefund(requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.denyRefund({ requestId }));
    }

    pauseRequest(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.pauseRequest({ repairerUserId, requestId }));
    }

    resumeRequest(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.resumeRequest({ repairerUserId, requestId }));
    }

    confirmSchedulePresence(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.confirmSchedulePresence({ repairerUserId, requestId }));
    }

    reassignRepairer(managerId: string, requestId: string, newRepairerId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.reassignRepairer({ managerId, requestId, newRepairerId }));
    }

    acceptCompletion(userId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.acceptCompletion({ userId, requestId }));
    }

    // ── Work steps ──

    addStep(repairerUserId: string, requestId: string, dto: { title: string; description?: string; comment?: string; order?: number; isMandatory?: boolean }): Promise<WorkStepResponse> {
        return grpcCall(this.repairService.addStep({
            repairerUserId,
            requestId,
            title: dto.title,
            description: dto.description ?? '',
            comment: dto.comment ?? '',
            order: dto.order ?? 0,
            isFinal: false,
            isMandatory: dto.isMandatory ?? false,
        }));
    }

    updateStep(repairerUserId: string, requestId: string, stepId: string, dto: { title?: string; description?: string; comment?: string; status?: string }): Promise<WorkStepResponse> {
        return grpcCall(this.repairService.updateStep({
            repairerUserId,
            requestId,
            stepId,
            title: dto.title ?? '',
            description: dto.description ?? '',
            comment: dto.comment ?? '',
            status: dto.status ?? '',
        }));
    }

    completeStep(repairerUserId: string, requestId: string, stepId: string): Promise<CompleteStepResponse> {
        return grpcCall(this.repairService.completeStep({ repairerUserId, requestId, stepId }));
    }

    deleteStep(repairerUserId: string, requestId: string, stepId: string): Promise<RepairEmptyResponse> {
        return grpcCall(this.repairService.deleteStep({ repairerUserId, requestId, stepId }));
    }

    lockSteps(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.lockSteps({ repairerUserId, requestId }));
    }

    getSteps(requestId: string): Promise<WorkStepListResponse> {
        return grpcCall(this.repairService.getSteps({ requestId }));
    }

    approveDiagnostics(repairerUserId: string, requestId: string): Promise<RepairEmptyResponse> {
        return grpcCall(this.repairService.approveDiagnostics({ repairerUserId, requestId }));
    }

    declineDiagnostics(repairerUserId: string, requestId: string, reason?: string): Promise<WorkStepListResponse> {
        return grpcCall(this.repairService.declineDiagnostics({ repairerUserId, requestId, reason: reason ?? '' }));
    }

    // ── Broken parts ──

    addBrokenPart(userId: string, requestId: string, dto: { devicePartId?: string; name?: string; note?: string; isSuggestion?: boolean }): Promise<BrokenPartResponse> {
        return grpcCall(this.repairService.addBrokenPart({
            userId,
            requestId,
            devicePartId: dto.devicePartId ?? '',
            name: dto.name ?? '',
            note: dto.note ?? '',
            isSuggestion: dto.isSuggestion ?? false,
        }));
    }

    updateBrokenPart(userId: string, requestId: string, partId: string, dto: { name?: string; note?: string }): Promise<BrokenPartResponse> {
        return grpcCall(this.repairService.updateBrokenPart({
            userId,
            requestId,
            partId,
            name: dto.name ?? '',
            note: dto.note ?? '',
        }));
    }

    updateBrokenPartStatus(userId: string, requestId: string, partId: string, status: string): Promise<BrokenPartResponse> {
        return grpcCall(this.repairService.updateBrokenPartStatus({
            userId,
            requestId,
            partId,
            status,
        }));
    }

    deleteBrokenPart(userId: string, requestId: string, partId: string): Promise<RepairEmptyResponse> {
        return grpcCall(this.repairService.deleteBrokenPart({
            userId,
            requestId,
            partId,
        }));
    }

    getBrokenParts(requestId: string): Promise<BrokenPartListResponse> {
        return grpcCall(this.repairService.getBrokenParts({ requestId }));
    }

    orderBrokenPart(userId: string, requestId: string, partId: string, supplier?: string): Promise<BrokenPartResponse> {
        return grpcCall(this.repairService.orderBrokenPart({
            userId,
            requestId,
            partId,
            supplier: supplier ?? '',
        }));
    }

    // ── Queries ──

    findById(id: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.findById({ id }));
    }

    findByUser(userId: string, pagination: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findByUser({
            userId,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
            status: pagination.status ?? '',
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
            dateFrom: pagination.dateFrom ?? '',
            dateTo: pagination.dateTo ?? '',
        }));
    }

    findByRepairer(repairerUserId: string, pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findByRepairer({
            repairerUserId,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
        }));
    }

    findByRepairerFiltered(repairerUserId: string, pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }, status?: string, search?: string): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findByRepairerFiltered({
            repairerUserId,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            status: status ?? '',
            search: search ?? '',
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
            dateFrom: pagination.dateFrom ?? '',
            dateTo: pagination.dateTo ?? '',
        }));
    }

    findActiveByRepairer(repairerUserId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.findActiveByRepairer({ repairerUserId }));
    }

    findPausedByRepairer(repairerUserId: string, pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findPausedByRepairer({
            repairerUserId,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
        }));
    }

    findAll(pagination: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findAll({
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
            status: pagination.status ?? '',
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
            dateFrom: pagination.dateFrom ?? '',
            dateTo: pagination.dateTo ?? '',
        }));
    }

    checkActiveForDevice(userDeviceId: string): Promise<RepairCheckActiveResponse> {
        return grpcCall(this.repairService.checkActiveForDevice({ userDeviceId }));
    }

    // ── Chat ──

    setConversationId(requestId: string, conversationId: string): Promise<RepairEmptyResponse> {
        return grpcCall(this.repairService.setConversationId({ requestId, conversationId }));
    }

    findOpenChatsForClose(): Promise<RepairOpenChatsResponse> {
        return grpcCall(this.repairService.findOpenChatsForClose({}));
    }

    clearChatCloseAt(requestId: string): Promise<RepairClearChatCloseAtResponse> {
        return grpcCall(this.repairService.clearChatCloseAt({ requestId }));
    }

    getRepairersActiveRequestCounts(repairerIds: string[]): Promise<RepairRepairersStatsResponse> {
        return grpcCall(this.repairService.getRepairersActiveRequestCounts({ repairerIds }));
    }

    getCompletionMetrics(dateFrom: string, dateTo: string): Promise<RepairCompletionMetricsResponse> {
        return grpcCall(this.repairService.getCompletionMetrics({ dateFrom, dateTo }));
    }

    // ── AVR (Work Completion Act) ──

    generateAvr(repairerUserId: string, requestId: string, dto: { completionNote?: string; userName: string; userPhone: string; userEmail: string; repairerName: string }): Promise<GenerateAvrResponse> {
        return grpcCall(this.repairService.generateAvr({
            repairerUserId,
            requestId,
            completionNote: dto.completionNote ?? '',
            userName: dto.userName,
            userPhone: dto.userPhone,
            userEmail: dto.userEmail,
            repairerName: dto.repairerName,
        }));
    }

    resetAvr(repairerUserId: string, requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.resetAvr({ repairerUserId, requestId }));
    }

    setAvrDocumentId(requestId: string, documentId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.setAvrDocumentId({ requestId, documentId }));
    }

    setAvrPendingSignature(requestId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.setAvrPendingSignature({ requestId }));
    }

    signAvrDigital(requestId: string, userId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.signAvrDigital({ requestId, userId }));
    }

    uploadAvrScan(requestId: string, repairerUserId: string, signedDocumentId?: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.uploadAvrScan({ requestId, repairerUserId, signedDocumentId: signedDocumentId ?? '' }));
    }
}

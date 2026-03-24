import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    RepairServiceClient,
    RepairRequestResponse,
    PaginatedRepairRequestsResponse,
    WorkStepResponse,
    WorkStepListResponse,
    CompleteStepResponse,
    RepairEmptyResponse,
    RepairCheckActiveResponse,
    BrokenPartResponse,
    BrokenPartListResponse,
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

    // ── Work steps ──

    addStep(repairerUserId: string, requestId: string, dto: { title: string; description?: string; order?: number; isFinal?: boolean }): Promise<WorkStepResponse> {
        return grpcCall(this.repairService.addStep({
            repairerUserId,
            requestId,
            title: dto.title,
            description: dto.description ?? '',
            order: dto.order ?? 0,
            isFinal: dto.isFinal ?? false,
        }));
    }

    updateStep(repairerUserId: string, requestId: string, stepId: string, dto: { title?: string; description?: string; status?: string }): Promise<WorkStepResponse> {
        return grpcCall(this.repairService.updateStep({
            repairerUserId,
            requestId,
            stepId,
            title: dto.title ?? '',
            description: dto.description ?? '',
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

    // ── Broken parts ──

    addBrokenPart(userId: string, requestId: string, dto: { devicePartId?: string; name?: string; note?: string }): Promise<BrokenPartResponse> {
        return grpcCall(this.repairService.addBrokenPart({
            userId,
            requestId,
            devicePartId: dto.devicePartId ?? '',
            name: dto.name ?? '',
            note: dto.note ?? '',
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

    // ── Queries ──

    findById(id: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.findById({ id }));
    }

    findByUser(userId: string, pagination: { offset?: number; limit?: number }): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findByUser({
            userId,
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 20,
        }));
    }

    findByRepairer(repairerUserId: string, pagination: { offset?: number; limit?: number }): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findByRepairer({
            repairerUserId,
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 20,
        }));
    }

    findByRepairerFiltered(repairerUserId: string, pagination: { offset?: number; limit?: number }, status?: string): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findByRepairerFiltered({
            repairerUserId,
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 20,
            status: status ?? '',
        }));
    }

    findActiveByRepairer(repairerUserId: string): Promise<RepairRequestResponse> {
        return grpcCall(this.repairService.findActiveByRepairer({ repairerUserId }));
    }

    findAll(pagination: { offset?: number; limit?: number }): Promise<PaginatedRepairRequestsResponse> {
        return grpcCall(this.repairService.findAll({
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 20,
        }));
    }

    checkActiveForDevice(userDeviceId: string): Promise<RepairCheckActiveResponse> {
        return grpcCall(this.repairService.checkActiveForDevice({ userDeviceId }));
    }
}

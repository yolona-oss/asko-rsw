import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RepairRequestService } from 'services/repair-request.service';
import { WorkStepService } from 'services/work-step.service';
import { AppError } from 'common/error';
import type { RepairRequest } from 'entities/repair-request.entity';
import type { WorkStep } from 'entities/work-step.entity';

// Import request types from proto interfaces
import type {
    RepairCreateRequest,
    RepairCancelRequest,
    RepairRequestRefundRequest,
    RepairAssignRepairerRequest,
    RepairAcceptRequest,
    RepairRefuseRequest,
    RepairStartWorkRequest,
    RepairSetPriceRequest,
    RepairMarkAwaitingCompletionRequest,
    RepairCompleteRequest,
    RepairApproveRefundRequest,
    RepairDenyRefundRequest,
    RepairAddStepRequest,
    RepairUpdateStepRequest,
    RepairCompleteStepRequest,
    RepairDeleteStepRequest,
    RepairLockStepsRequest,
    RepairGetStepsRequest,
    RepairFindByIdRequest,
    RepairFindByUserRequest,
    RepairFindByRepairerRequest,
    RepairFindByRepairerFilteredRequest,
    RepairFindActiveByRepairerRequest,
    RepairFindAllRequest,
    RepairCheckActiveForDeviceRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 400: grpcCode = status.INVALID_ARGUMENT; break;
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
}

function requestToRecord(entity: RepairRequest) {
    return {
        id: entity.id,
        userId: entity.userId,
        userDeviceId: typeof entity.userDevice === 'object' ? entity.userDevice.id : String(entity.userDevice),
        repairerId: entity.repairer ? (typeof entity.repairer === 'object' ? entity.repairer.id : String(entity.repairer)) : '',
        managerId: entity.managerId ?? '',
        certificateId: entity.certificate ? (typeof entity.certificate === 'object' ? entity.certificate.id : String(entity.certificate)) : '',
        addressId: entity.address ? (typeof entity.address === 'object' ? entity.address.id : String(entity.address)) : '',
        status: entity.status,
        description: entity.description,
        preferredDate: entity.preferredDate?.toISOString() ?? '',
        totalCost: entity.totalCost ?? 0,
        refundRequested: entity.refundRequested,
        refundReason: entity.refundReason ?? '',
        refuseReason: entity.refuseReason ?? '',
        rejectedRepairers: entity.rejectedRepairers ? JSON.stringify(entity.rejectedRepairers) : '',
        completionNote: entity.completionNote ?? '',
        stepsLocked: entity.stepsLocked,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function stepToRecord(entity: WorkStep) {
    return {
        id: entity.id,
        repairRequestId: typeof entity.repairRequest === 'object' ? entity.repairRequest.id : String(entity.repairRequest),
        title: entity.title,
        description: entity.description ?? '',
        status: entity.status,
        order: entity.order,
        isFinal: entity.isFinal,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

@Controller()
export class RepairGrpcController {
    constructor(
        private readonly repairRequestService: RepairRequestService,
        private readonly workStepService: WorkStepService,
    ) {}

    // ── Repair request lifecycle ──

    @GrpcMethod('RepairService', 'CreateRequest')
    async createRequest(data: RepairCreateRequest) {
        try {
            const request = await this.repairRequestService.create(data.userId, {
                userDeviceId: data.userDeviceId,
                description: data.description,
                certificateId: data.certificateId || undefined,
                preferredDate: data.preferredDate || undefined,
            });
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'CancelRequest')
    async cancelRequest(data: RepairCancelRequest) {
        try {
            const request = await this.repairRequestService.cancel(data.userId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'RequestRefund')
    async requestRefund(data: RepairRequestRefundRequest) {
        try {
            const request = await this.repairRequestService.requestRefund(data.userId, data.requestId, data.reason);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'AssignRepairer')
    async assignRepairer(data: RepairAssignRepairerRequest) {
        try {
            const request = await this.repairRequestService.assignRepairer(data.managerId, data.requestId, data.repairerId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'AcceptRequest')
    async acceptRequest(data: RepairAcceptRequest) {
        try {
            const request = await this.repairRequestService.acceptRequest(data.repairerUserId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'RefuseRequest')
    async refuseRequest(data: RepairRefuseRequest) {
        try {
            const request = await this.repairRequestService.refuseRequest(data.repairerUserId, data.requestId, data.reason);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'StartWork')
    async startWork(data: RepairStartWorkRequest) {
        try {
            const request = await this.repairRequestService.startWork(data.repairerUserId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'SetPrice')
    async setPrice(data: RepairSetPriceRequest) {
        try {
            const request = await this.repairRequestService.setPrice(data.repairerUserId, data.requestId, data.amount);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'MarkAwaitingCompletion')
    async markAwaitingCompletion(data: RepairMarkAwaitingCompletionRequest) {
        try {
            await this.repairRequestService.markAwaitingCompletion(data.requestId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'Complete')
    async complete(data: RepairCompleteRequest) {
        try {
            const request = await this.repairRequestService.complete(data.requestId, data.description || undefined);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'ApproveRefund')
    async approveRefund(data: RepairApproveRefundRequest) {
        try {
            const request = await this.repairRequestService.approveRefund(data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'DenyRefund')
    async denyRefund(data: RepairDenyRefundRequest) {
        try {
            const request = await this.repairRequestService.denyRefund(data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Work steps ──

    @GrpcMethod('RepairService', 'AddStep')
    async addStep(data: RepairAddStepRequest) {
        try {
            const step = await this.workStepService.addStep(data.repairerUserId, data.requestId, {
                title: data.title,
                description: data.description || undefined,
                order: data.order || undefined,
                isFinal: data.isFinal || false,
            });
            return { step: stepToRecord(step) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'UpdateStep')
    async updateStep(data: RepairUpdateStepRequest) {
        try {
            const step = await this.workStepService.updateStep(data.repairerUserId, data.requestId, data.stepId, {
                title: data.title || undefined,
                description: data.description,
                status: data.status || undefined,
            });
            return { step: stepToRecord(step) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'CompleteStep')
    async completeStep(data: RepairCompleteStepRequest) {
        try {
            const { step, requestCompleted } = await this.workStepService.completeStep(data.repairerUserId, data.requestId, data.stepId);
            return { step: stepToRecord(step), requestCompleted };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'DeleteStep')
    async deleteStep(data: RepairDeleteStepRequest) {
        try {
            await this.workStepService.deleteStep(data.repairerUserId, data.requestId, data.stepId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'LockSteps')
    async lockSteps(data: RepairLockStepsRequest) {
        try {
            const request = await this.workStepService.lockSteps(data.repairerUserId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'GetSteps')
    async getSteps(data: RepairGetStepsRequest) {
        try {
            const steps = await this.workStepService.getSteps(data.requestId);
            return { steps: steps.map(stepToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Queries ──

    @GrpcMethod('RepairService', 'FindById')
    async findById(data: RepairFindByIdRequest) {
        try {
            const request = await this.repairRequestService.findById(data.id);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindByUser')
    async findByUser(data: RepairFindByUserRequest) {
        try {
            const result = await this.repairRequestService.findByUser(data.userId, {
                offset: data.offset,
                limit: data.limit,
            });
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindByRepairer')
    async findByRepairer(data: RepairFindByRepairerRequest) {
        try {
            const result = await this.repairRequestService.findByRepairer(data.repairerUserId, {
                offset: data.offset,
                limit: data.limit,
            });
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindByRepairerFiltered')
    async findByRepairerFiltered(data: RepairFindByRepairerFilteredRequest) {
        try {
            const result = await this.repairRequestService.findByRepairerFiltered(
                data.repairerUserId,
                { offset: data.offset, limit: data.limit },
                data.status || undefined,
            );
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindActiveByRepairer')
    async findActiveByRepairer(data: RepairFindActiveByRepairerRequest) {
        try {
            const request = await this.repairRequestService.findActiveByRepairer(data.repairerUserId);
            return { request: request ? requestToRecord(request) : undefined };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindAll')
    async findAll(data: RepairFindAllRequest) {
        try {
            const result = await this.repairRequestService.findAll({
                offset: data.offset,
                limit: data.limit,
            });
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'CheckActiveForDevice')
    async checkActiveForDevice(data: RepairCheckActiveForDeviceRequest) {
        try {
            const result = await this.repairRequestService.checkActiveForDevice(data.userDeviceId);
            return {
                hasActive: result.hasActive,
                request: result.request ? requestToRecord(result.request) : undefined,
            };
        } catch (e) { throw toGrpcError(e); }
    }
}

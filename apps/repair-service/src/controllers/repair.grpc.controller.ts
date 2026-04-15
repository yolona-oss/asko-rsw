import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RepairRequestService } from 'services/repair-request.service';
import { WorkStepService } from 'services/work-step.service';
import { BrokenPartService } from 'services/broken-part.service';
import { AppError } from 'common/error';
import type { RepairRequest } from 'entities/repair-request.entity';
import type { UserDevice } from 'entities/user-device.entity';
import type { Device } from 'entities/device.entity';
import type { Repairer } from 'entities/repairer.entity';
import type { Certificate } from 'entities/certificate.entity';
import type { Address } from 'entities/address.entity';
import type { WorkStep } from 'entities/work-step.entity';
import type { BrokenPart } from 'entities/broken-part.entity';

// Import request types from proto interfaces
import type {
    RepairCreateRequest,
    RepairCancelRequest,
    RepairRequestRefundRequest,
    RepairAssignRepairerRequest,
    RepairAcceptRequest,
    RepairDepartRequest,
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
    RepairApproveDiagnosticsRequest,
    RepairDeclineDiagnosticsRequest,
    RepairFindByIdRequest,
    RepairFindByUserRequest,
    RepairFindByRepairerRequest,
    RepairFindByRepairerFilteredRequest,
    RepairFindActiveByRepairerRequest,
    RepairFindAllRequest,
    RepairCheckActiveForDeviceRequest,
    RepairPauseRequest,
    RepairResumeRequest,
    RepairConfirmSchedulePresenceRequest,
    RepairReassignRepairerRequest,
    RepairFindPausedByRepairerRequest,
    RepairSetConversationIdRequest,
    RepairFindOpenChatsRequest,
    RepairClearChatCloseAtRequest,
    RepairAddBrokenPartRequest,
    RepairUpdateBrokenPartRequest,
    RepairUpdateBrokenPartStatusRequest,
    RepairDeleteBrokenPartRequest,
    RepairGetBrokenPartsRequest,
    RepairOrderBrokenPartRequest,
    RepairAcceptCompletionRequest,
    GenerateAvrRequest,
    ResetAvrRequest,
    SetAvrDocumentIdRequest,
    SetAvrPendingSignatureRequest,
    SignAvrDigitalRequest,
    UploadAvrScanRequest,
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

function deviceToRecord(entity: Device) {
    return {
        id: entity.id,
        name: entity.name,
        type: entity.category?.name ?? '',
        model: entity.model,
        brand: entity.brand,
        price: entity.price ?? 0,
        description: entity.description ?? '',
        specifications: entity.specifications ? JSON.stringify(entity.specifications) : '',
        features: entity.features ? JSON.stringify(entity.features) : '',
        slug: entity.slug,
        isFeatured: entity.isFeatured ?? false,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function addressToRecord(entity: Address) {
    return {
        id: entity.id,
        country: '',
        city: entity.city,
        street: entity.street,
        house: parseInt(entity.house) || 0,
        building: parseInt(entity.building ?? '') || 0,
        floor: parseInt(entity.floor ?? '') || 0,
        room: parseInt(entity.apartment ?? '') || 0,
        postalCode: '',
        latitude: entity.latitude ?? 0,
        longitude: entity.longitude ?? 0,
        validationStatus: entity.validationStatus ?? 'pending',
        validationError: entity.validationError ?? '',
    };
}

function userDeviceToRecord(entity: UserDevice) {
    const device = typeof entity.device === 'object' ? entity.device : null;
    const address = typeof entity.address === 'object' ? entity.address : null;
    return {
        id: entity.id,
        userId: entity.userId,
        deviceId: device?.id ?? '',
        serialNumber: entity.serialNumber,
        addressId: address?.id ?? '',
        purchaseDate: entity.purchaseDate?.toISOString() ?? '',
        warrantyUntil: entity.warrantyUntil?.toISOString() ?? '',
        notes: entity.notes ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        device: device ? deviceToRecord(device) : undefined,
        address: address ? addressToRecord(address) : undefined,
    };
}

function repairerToRecord(entity: Repairer) {
    return {
        id: entity.id,
        userId: entity.userId,
        specializations: entity.specializations ?? [],
        city: entity.city,
        isActive: entity.isActive,
        completedRepairs: entity.completedRepairs,
        latitude: entity.latitude ?? 0,
        longitude: entity.longitude ?? 0,
        lastLocationUpdate: entity.lastLocationUpdate?.toISOString() ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function certificateToRecord(entity: Certificate) {
    return {
        id: entity.id,
        userId: entity.userId,
        userDeviceId: typeof entity.userDevice === 'object' ? entity.userDevice.id : String(entity.userDevice),
        dealerId: entity.dealer ? (typeof entity.dealer === 'object' ? entity.dealer.id : String(entity.dealer)) : '',
        certificateNumber: entity.certificateNumber,
        status: entity.status,
        issuedAt: entity.issuedAt?.toISOString() ?? '',
        expiresAt: entity.expiresAt?.toISOString() ?? '',
        price: entity.price ?? 0,
        paid: entity.paid ?? false,
        purchaseReceiptUrl: entity.purchaseReceiptUrl ?? '',
        description: entity.description ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
    };
}

function requestToRecord(entity: RepairRequest) {
    const userDevice = typeof entity.userDevice === 'object' ? entity.userDevice : null;
    const repairer = typeof entity.repairer === 'object' ? entity.repairer : null;
    const certificate = typeof entity.certificate === 'object' ? entity.certificate : null;
    const address = typeof entity.address === 'object' ? entity.address : null;

    return {
        id: entity.id,
        userId: entity.userId,
        userDeviceId: userDevice ? userDevice.id : String(entity.userDevice),
        repairerId: repairer ? repairer.id : (entity.repairer ? String(entity.repairer) : ''),
        managerId: entity.managerId ?? '',
        certificateId: certificate ? certificate.id : (entity.certificate ? String(entity.certificate) : ''),
        addressId: address ? address.id : (entity.address ? String(entity.address) : ''),
        status: entity.status,
        description: entity.description,
        preferredDate: entity.preferredDate?.toISOString() ?? '',
        totalCost: entity.totalCost ?? 0,
        refundRequested: entity.refundRequested,
        refundReason: entity.refundReason ?? '',
        refuseReason: entity.refuseReason ?? '',
        completionNote: entity.completionNote ?? '',
        stepsLocked: entity.stepsLocked,
        certificateValid: entity.certificateValid,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
        statusBeforePause: entity.statusBeforePause ?? '',
        conversationId: entity.conversationId ?? '',
        chatCloseAt: entity.chatCloseAt?.toISOString() ?? '',
        completionSignature: entity.completionSignature ?? '',
        completionSignedPayload: entity.completionSignedPayload ?? '',
        acceptanceSignature: entity.acceptanceSignature ?? '',
        acceptanceSignedPayload: entity.acceptanceSignedPayload ?? '',
        userDevice: userDevice ? userDeviceToRecord(userDevice) : undefined,
        repairer: repairer ? repairerToRecord(repairer) : undefined,
        certificate: certificate ? certificateToRecord(certificate) : undefined,
        certificateSnapshot: entity.certificateSnapshot ? {
            id: entity.certificateSnapshot.id,
            certificateNumber: entity.certificateSnapshot.certificateNumber,
            status: entity.certificateSnapshot.status,
            issuedAt: entity.certificateSnapshot.issuedAt,
            expiresAt: entity.certificateSnapshot.expiresAt,
            frozenAt: entity.certificateSnapshot.frozenAt,
            signedPayload: entity.certificateSnapshot.signedPayload,
            signature: entity.certificateSnapshot.signature,
        } : undefined,
        address: address ? addressToRecord(address) : undefined,
        avrStatus: entity.avrStatus ?? 'none',
        avrSigningMethod: entity.avrSigningMethod ?? '',
        avrDocumentId: entity.avrDocumentId ?? '',
        avrSignedDocumentId: entity.avrSignedDocumentId ?? '',
        avrSignedAt: entity.avrSignedAt?.toISOString() ?? '',
        avrSignedPayload: entity.avrSignedPayload ?? '',
        avrSignature: entity.avrSignature ?? '',
        statusTimestamps: JSON.stringify(entity.statusTimestamps ?? []),
        scheduleEndNotifiedAt: entity.scheduleEndNotifiedAt?.toISOString() ?? '',
        scheduleEndConfirmedAt: entity.scheduleEndConfirmedAt?.toISOString() ?? '',
    };
}

function brokenPartToRecord(entity: BrokenPart) {
    return {
        id: entity.id,
        repairRequestId: typeof entity.repairRequest === 'object' ? entity.repairRequest.id : String(entity.repairRequest),
        devicePartId: entity.devicePart ? (typeof entity.devicePart === 'object' ? entity.devicePart.id : String(entity.devicePart)) : '',
        name: entity.name,
        status: entity.status,
        note: entity.note ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
        externalOrderId: entity.externalOrderId ?? '',
        supplierProvider: entity.supplierProvider ?? '',
        orderedAt: entity.orderedAt?.toISOString() ?? '',
        isSuggestion: entity.isSuggestion,
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
        isMandatory: entity.isMandatory,
        comment: entity.comment ?? '',
        declinedAt: entity.declinedAt?.toISOString() ?? '',
        declinedByRepairerId: entity.declinedByRepairerId ?? '',
        completedByRepairerId: entity.completedByRepairerId ?? '',
    };
}

@Controller()
export class RepairGrpcController {
    constructor(
        private readonly repairRequestService: RepairRequestService,
        private readonly workStepService: WorkStepService,
        private readonly brokenPartService: BrokenPartService,
    ) {}

    // ── Repair request lifecycle ──

    @GrpcMethod('RepairService', 'CreateRequest')
    async createRequest(data: RepairCreateRequest) {
        try {
            const brokenParts = data.brokenParts?.map(bp => ({
                devicePartId: bp.devicePartId || undefined,
                name: bp.name || undefined,
                note: bp.note || undefined,
            }));
            const request = await this.repairRequestService.create(data.userId, {
                userDeviceId: data.userDeviceId,
                description: data.description,
                certificateId: data.certificateId || undefined,
                preferredDate: data.preferredDate || undefined,
                brokenParts,
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

    @GrpcMethod('RepairService', 'Depart')
    async depart(data: RepairDepartRequest) {
        try {
            const request = await this.repairRequestService.depart(data.repairerUserId, data.requestId);
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

    @GrpcMethod('RepairService', 'PauseRequest')
    async pauseRequest(data: RepairPauseRequest) {
        try {
            const request = await this.repairRequestService.pause(data.repairerUserId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'ResumeRequest')
    async resumeRequest(data: RepairResumeRequest) {
        try {
            const request = await this.repairRequestService.resume(data.repairerUserId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'ConfirmSchedulePresence')
    async confirmSchedulePresence(data: RepairConfirmSchedulePresenceRequest) {
        try {
            const request = await this.repairRequestService.confirmSchedulePresence(data.repairerUserId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'ReassignRepairer')
    async reassignRepairer(data: RepairReassignRepairerRequest) {
        try {
            const request = await this.repairRequestService.reassign(data.managerId, data.requestId, data.newRepairerId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'AcceptCompletion')
    async acceptCompletion(data: RepairAcceptCompletionRequest) {
        try {
            const request = await this.repairRequestService.acceptCompletion(data.userId, data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── AVR (Work Completion Act) ──

    @GrpcMethod('RepairService', 'GenerateAvr')
    async generateAvr(data: GenerateAvrRequest) {
        try {
            const { pdfBuffer, request } = await this.repairRequestService.generateAvr(
                data.requestId,
                data.repairerUserId,
                { name: data.userName, phone: data.userPhone, email: data.userEmail },
                data.repairerName,
                data.completionNote || undefined,
            );
            return { pdfBuffer, requestId: request.id, avrStatus: request.avrStatus };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'ResetAvr')
    async resetAvr(data: ResetAvrRequest) {
        try {
            const request = await this.repairRequestService.resetAvr(data.requestId, data.repairerUserId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'SetAvrDocumentId')
    async setAvrDocumentId(data: SetAvrDocumentIdRequest) {
        try {
            const request = await this.repairRequestService.setAvrDocumentId(data.requestId, data.documentId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'SetAvrPendingSignature')
    async setAvrPendingSignature(data: SetAvrPendingSignatureRequest) {
        try {
            const request = await this.repairRequestService.setAvrPendingSignature(data.requestId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'SignAvrDigital')
    async signAvrDigital(data: SignAvrDigitalRequest) {
        try {
            const request = await this.repairRequestService.signAvrDigital(data.requestId, data.userId);
            return { request: requestToRecord(request) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'UploadAvrScan')
    async uploadAvrScan(data: UploadAvrScanRequest) {
        try {
            const request = await this.repairRequestService.uploadAvrScan(data.requestId, data.repairerUserId, data.signedDocumentId);
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
                comment: data.comment || undefined,
                order: data.order || undefined,
                isMandatory: data.isMandatory || false,
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
                comment: data.comment,
                status: data.status || undefined,
            });
            return { step: stepToRecord(step) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'ApproveDiagnostics')
    async approveDiagnostics(data: RepairApproveDiagnosticsRequest) {
        try {
            await this.workStepService.approveDiagnostics(data.repairerUserId, data.requestId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'DeclineDiagnostics')
    async declineDiagnostics(data: RepairDeclineDiagnosticsRequest) {
        try {
            const newSteps = await this.workStepService.declineDiagnostics(data.repairerUserId, data.requestId, data.reason || undefined);
            return { steps: newSteps.map(stepToRecord) };
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

    // ── Broken parts ──

    @GrpcMethod('RepairService', 'AddBrokenPart')
    async addBrokenPart(data: RepairAddBrokenPartRequest) {
        try {
            const part = await this.brokenPartService.addBrokenPart(data.requestId, {
                devicePartId: data.devicePartId || undefined,
                name: data.name || undefined,
                note: data.note || undefined,
                isSuggestion: data.isSuggestion || false,
            });
            return { part: brokenPartToRecord(part) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'UpdateBrokenPart')
    async updateBrokenPart(data: RepairUpdateBrokenPartRequest) {
        try {
            const part = await this.brokenPartService.updateBrokenPart(data.requestId, data.partId, {
                name: data.name || undefined,
                note: data.note,
            });
            return { part: brokenPartToRecord(part) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'UpdateBrokenPartStatus')
    async updateBrokenPartStatus(data: RepairUpdateBrokenPartStatusRequest) {
        try {
            const part = await this.brokenPartService.updateBrokenPartStatus(
                data.requestId,
                data.partId,
                data.status as any,
            );
            return { part: brokenPartToRecord(part) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'DeleteBrokenPart')
    async deleteBrokenPart(data: RepairDeleteBrokenPartRequest) {
        try {
            await this.brokenPartService.deleteBrokenPart(data.requestId, data.partId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'GetBrokenParts')
    async getBrokenParts(data: RepairGetBrokenPartsRequest) {
        try {
            const parts = await this.brokenPartService.getBrokenParts(data.requestId);
            return { parts: parts.map(brokenPartToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'OrderBrokenPart')
    async orderBrokenPart(data: RepairOrderBrokenPartRequest) {
        try {
            const part = await this.brokenPartService.orderFromSupplier(
                data.userId,
                data.requestId,
                data.partId,
                data.supplier || undefined,
            );
            return { part: brokenPartToRecord(part) };
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
                page: data.page,
                limit: data.limit,
                search: data.search || undefined,
                status: data.status || undefined,
                dateFrom: data.dateFrom || undefined,
                dateTo: data.dateTo || undefined,
            });
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindByRepairer')
    async findByRepairer(data: RepairFindByRepairerRequest) {
        try {
            const result = await this.repairRequestService.findByRepairer(data.repairerUserId, {
                page: data.page,
                limit: data.limit,
            });
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindByRepairerFiltered')
    async findByRepairerFiltered(data: RepairFindByRepairerFilteredRequest) {
        try {
            const result = await this.repairRequestService.findByRepairerFiltered(
                data.repairerUserId,
                { page: data.page, limit: data.limit, dateFrom: data.dateFrom || undefined, dateTo: data.dateTo || undefined },
                data.status || undefined,
                data.search || undefined,
            );
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindPausedByRepairer')
    async findPausedByRepairer(data: RepairFindPausedByRepairerRequest) {
        try {
            const result = await this.repairRequestService.findPausedByRepairer(data.repairerUserId, {
                page: data.page,
                limit: data.limit,
            });
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                page: data.page,
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
                page: data.page,
                limit: data.limit,
                search: data.search || undefined,
                status: data.status || undefined,
                dateFrom: data.dateFrom || undefined,
                dateTo: data.dateTo || undefined,
            });
            return {
                data: result.data.map(requestToRecord),
                overallCount: result.total,
                page: data.page,
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

    // ── Chat ──

    @GrpcMethod('RepairService', 'SetConversationId')
    async setConversationId(data: RepairSetConversationIdRequest) {
        try {
            await this.repairRequestService.setConversationId(data.requestId, data.conversationId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'FindOpenChatsForClose')
    async findOpenChatsForClose(_data: RepairFindOpenChatsRequest) {
        try {
            const chats = await this.repairRequestService.findOpenChatsForClose();
            return { chats };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'ClearChatCloseAt')
    async clearChatCloseAt(data: RepairClearChatCloseAtRequest) {
        try {
            const conversationId = await this.repairRequestService.clearChatCloseAt(data.requestId);
            return { conversationId: conversationId ?? '' };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'GetRepairersActiveRequestCounts')
    async getRepairersActiveRequestCounts(data: { repairerIds: string[] }) {
        try {
            const stats = await this.repairRequestService.getRepairersActiveRequestCounts(data.repairerIds ?? []);
            return { stats };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairService', 'GetCompletionMetrics')
    async getCompletionMetrics(data: { dateFrom: string; dateTo: string }) {
        try {
            return await this.repairRequestService.getCompletionMetrics(
                new Date(data.dateFrom),
                new Date(data.dateTo),
            );
        } catch (e) { throw toGrpcError(e); }
    }
}

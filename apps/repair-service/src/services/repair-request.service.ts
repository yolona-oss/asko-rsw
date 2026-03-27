import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { RepairRequest } from 'entities/repair-request.entity';
import { UserDevice } from 'entities/user-device.entity';
import { Certificate } from 'entities/certificate.entity';
import { Repairer } from 'entities/repairer.entity';
import { Address } from 'entities/address.entity';
import { RepairRequestStatus, CertificateStatus, PaymentTargetType } from '@asko/shared';
import { AppErrors } from 'common/error';
import { assertTransition, assertActionTransition, canTransition } from 'common/repair-request-state-machine';
import { PaymentCommandService } from 'modules/payment-command.service';
import { RepairEventService, RepairEventType } from 'modules/repair-event.service';
import { WorkStep } from 'entities/work-step.entity';
import { BrokenPartService } from './broken-part.service';
import { SignatureService } from './signature.service';

@Injectable()
export class RepairRequestService {
    constructor(
        private readonly em: EntityManager,
        private readonly paymentCommandService: PaymentCommandService,
        private readonly repairEventService: RepairEventService,
        private readonly brokenPartService: BrokenPartService,
        private readonly signatureService: SignatureService,
    ) {}

    /** User creates a repair request */
    @CreateRequestContext()
    async create(userId: string, dto: { userDeviceId: string; description: string; certificateId?: string; preferredDate?: string; brokenParts?: { devicePartId?: string; name?: string; note?: string }[] }): Promise<RepairRequest> {
        // Validate user device directly
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId }, { populate: ['address'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        if (userDevice.userId !== userId) throw AppErrors.dbEntityNotFound('User device not found');

        // Check if there's already an active repair request for this device
        const activeRequest = await this.em.findOne(RepairRequest, {
            userDevice: dto.userDeviceId,
            status: {
                $nin: [
                    RepairRequestStatus.COMPLETED,
                    RepairRequestStatus.CANCELLED,
                    RepairRequestStatus.REFUNDED,
                    RepairRequestStatus.REFUSED,
                ],
            },
        });
        if (activeRequest) {
            throw AppErrors.conflict('Для этого устройства уже существует активная заявка на ремонт');
        }

        let certificate: Certificate | undefined;
        if (dto.certificateId) {
            const cert = await this.em.findOne(Certificate, { id: dto.certificateId });
            if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
            if (cert.userId !== userId) throw AppErrors.dbEntityNotFound('Certificate not found');
            if (cert.status !== CertificateStatus.ACTIVE) {
                throw AppErrors.badRequest('Certificate is not active');
            }
            if (new Date() > cert.expiresAt) {
                throw AppErrors.badRequest('Certificate has expired');
            }
            certificate = cert;
        }

        const addressRef = userDevice.address
            ? (typeof userDevice.address === 'object'
                ? this.em.getReference(Address, userDevice.address.id)
                : this.em.getReference(Address, String(userDevice.address)))
            : undefined;

        const request = this.em.create(RepairRequest, {
            userId,
            userDevice,
            certificate,
            description: dto.description,
            preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : undefined,
            address: addressRef,
            status: RepairRequestStatus.PENDING,
        });
        await this.em.persistAndFlush(request);

        if (dto.brokenParts && dto.brokenParts.length > 0) {
            await this.brokenPartService.addBrokenPartsOnCreate(request.id, dto.brokenParts);
        }

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId,
            newStatus: RepairRequestStatus.PENDING,
            timestamp: new Date(),
        });

        return request;
    }

    /** Mark repair request as paid after payment confirmation */
    @CreateRequestContext()
    async markPaid(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.PAID);

        const oldStatus = request.status;
        request.status = RepairRequestStatus.PAID;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.PAID,
            timestamp: new Date(),
        });

        return request;
    }

    /** User requests refund */
    @CreateRequestContext()
    async requestRefund(userId: string, requestId: string, reason: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        assertTransition(request.status, RepairRequestStatus.REFUND_REQUESTED);

        const oldStatus = request.status;
        request.refundRequested = true;
        request.refundReason = reason;
        request.status = RepairRequestStatus.REFUND_REQUESTED;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId,
            oldStatus,
            newStatus: RepairRequestStatus.REFUND_REQUESTED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager approves refund */
    @CreateRequestContext()
    async approveRefund(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.REFUNDED);

        request.status = RepairRequestStatus.REFUNDED;
        await this.em.flush();

        // Refund via payment-service RabbitMQ (fire-and-forget)
        await this.paymentCommandService.emitRefundTarget('repairRequest', requestId);

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.REFUND_REQUESTED,
            newStatus: RepairRequestStatus.REFUNDED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager denies refund */
    @CreateRequestContext()
    async denyRefund(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('denyRefund', request.status);

        request.refundRequested = false;
        request.status = RepairRequestStatus.PAID; // revert to paid
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.REFUND_REQUESTED,
            newStatus: RepairRequestStatus.PAID,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager assigns repairer to request */
    @CreateRequestContext()
    async assignRepairer(managerId: string, requestId: string, repairerId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.ASSIGNED);

        // Validate repairer directly
        const repairer = await this.em.findOne(Repairer, { id: repairerId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        if (!repairer.isActive) throw AppErrors.badRequest('Repairer is not active');

        const oldStatus = request.status;
        request.repairer = this.em.getReference(Repairer, repairerId);
        request.managerId = managerId;
        request.status = RepairRequestStatus.ASSIGNED;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.ASSIGNED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.ASSIGNED,
            repairerId,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer accepts assigned request */
    @CreateRequestContext()
    async acceptRequest(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.ACCEPTED);

        request.status = RepairRequestStatus.ACCEPTED;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.ASSIGNED,
            newStatus: RepairRequestStatus.ACCEPTED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer refuses assigned request - reverts to PAID so manager can re-assign */
    @CreateRequestContext()
    async refuseRequest(repairerUserId: string, requestId: string, reason: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('refuse', request.status);

        // Track rejected repairer
        if (!request.rejectedRepairers) request.rejectedRepairers = [];
        request.rejectedRepairers.push(repairer.id);

        request.status = RepairRequestStatus.PAID;
        request.refuseReason = reason;
        request.repairer = undefined;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.ASSIGNED,
            newStatus: RepairRequestStatus.PAID,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer starts working on request */
    @CreateRequestContext()
    async startWork(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.IN_PROGRESS);

        request.status = RepairRequestStatus.IN_PROGRESS;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.ACCEPTED,
            newStatus: RepairRequestStatus.IN_PROGRESS,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer sets or updates repair price */
    @CreateRequestContext()
    async setPrice(repairerUserId: string, requestId: string, amount: number): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (![RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.AWAITING_COMPLETION, RepairRequestStatus.COMPLETED].includes(request.status)) {
            throw AppErrors.badRequest('Price can only be set when request is in progress or completed');
        }

        request.totalCost = amount;
        await this.em.flush();

        // Create payment invoice via payment-service RabbitMQ (fire-and-forget)
        await this.paymentCommandService.emitCreateInvoice(
            request.userId,
            PaymentTargetType.REPAIR_REQUEST,
            request.id,
            amount,
        );

        return request;
    }

    /** Mark request as awaiting completion (last step done) */
    @CreateRequestContext()
    async markAwaitingCompletion(requestId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) return;
        if (!canTransition(request.status, RepairRequestStatus.AWAITING_COMPLETION)) return;
        const oldStatus = request.status;
        request.status = RepairRequestStatus.AWAITING_COMPLETION;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.AWAITING_COMPLETION,
            timestamp: new Date(),
        });
    }

    /** Complete the request with optional description */
    @CreateRequestContext()
    async complete(requestId: string, description?: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        const oldStatus = request.status;
        assertTransition(request.status, RepairRequestStatus.COMPLETED);
        if (!request.totalCost) {
            throw AppErrors.badRequest('Необходимо указать стоимость ремонта перед завершением');
        }

        request.status = RepairRequestStatus.COMPLETED;
        if (description) {
            request.completionNote = description;
        }

        // Update repairer stats directly (same DB)
        const repairerId = request.repairer
            ? (typeof request.repairer === 'object' ? request.repairer.id : String(request.repairer))
            : undefined;
        if (repairerId) {
            const repairer = await this.em.findOne(Repairer, { id: repairerId });
            if (repairer) {
                repairer.completedRepairs += 1;

                // Update repairer last location from address if available
                const addressId = request.address
                    ? (typeof request.address === 'object' ? request.address.id : String(request.address))
                    : undefined;
                if (addressId) {
                    try {
                        const address = await this.em.findOne(Address, { id: addressId });
                        if (address) {
                            // Placeholder coords -- gateway handles real geolocation
                            repairer.lastLocationUpdate = new Date();
                        }
                    } catch {
                        // Non-critical: don't fail completion if location update fails
                    }
                }
            }
        }

        // Schedule chat close 30 minutes after completion
        if (request.conversationId) {
            request.chatCloseAt = new Date(Date.now() + 30 * 60 * 1000);
        }

        // Sign completion data
        const workSteps = await this.em.find(WorkStep, { repairRequest: requestId });
        const workStepsSummary = workSteps
            .sort((a, b) => a.order - b.order)
            .map(s => `${s.title}:${s.status}`)
            .join(',');
        const completionPayload = {
            requestId: request.id,
            repairerId: repairerId ?? '',
            totalCost: request.totalCost ?? 0,
            completionNote: request.completionNote ?? '',
            workStepsSummary,
            signedAt: new Date().toISOString(),
        };
        request.completionSignedPayload = JSON.stringify(completionPayload, Object.keys(completionPayload).sort());
        request.completionSignature = this.signatureService.sign(completionPayload);

        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.COMPLETED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.COMPLETED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Customer accepts completed repair — cryptographic attestation */
    @CreateRequestContext()
    async acceptCompletion(userId: string, requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.COMPLETED) {
            throw AppErrors.badRequest('Can only accept completed repairs');
        }
        if (request.acceptanceSignature) {
            throw AppErrors.badRequest('Repair already accepted');
        }

        const payload = {
            requestId: request.id,
            userId,
            signedAt: new Date().toISOString(),
        };
        request.acceptanceSignedPayload = JSON.stringify(payload, Object.keys(payload).sort());
        request.acceptanceSignature = this.signatureService.sign(payload);
        await this.em.flush();

        return request;
    }

    /** Repairer pauses accepted or in-progress request */
    @CreateRequestContext()
    async pause(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.PAUSED);

        const oldStatus = request.status;
        request.statusBeforePause = request.status;
        request.status = RepairRequestStatus.PAUSED;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.PAUSED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer resumes a paused request */
    @CreateRequestContext()
    async resume(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('resume', request.status);

        const oldStatus = request.status;
        const resumeTo = (request.statusBeforePause as RepairRequestStatus) ?? RepairRequestStatus.IN_PROGRESS;
        request.status = resumeTo;
        request.statusBeforePause = undefined;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: resumeTo,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager reassigns request from current repairer to a new one */
    @CreateRequestContext()
    async reassign(managerId: string, requestId: string, newRepairerId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('reassign', request.status);

        const newRepairer = await this.em.findOne(Repairer, { id: newRepairerId });
        if (!newRepairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        if (!newRepairer.isActive) throw AppErrors.badRequest('Repairer is not active');

        // Track old repairer in rejected list
        const oldRepairerId = request.repairer
            ? (typeof request.repairer === 'object' ? request.repairer.id : String(request.repairer))
            : undefined;
        if (oldRepairerId) {
            if (!request.rejectedRepairers) request.rejectedRepairers = [];
            request.rejectedRepairers.push(oldRepairerId);
        }

        const oldStatus = request.status;
        request.repairer = this.em.getReference(Repairer, newRepairerId);
        request.managerId = managerId;
        request.status = RepairRequestStatus.ASSIGNED;
        request.statusBeforePause = undefined;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.ASSIGNED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.ASSIGNED,
            repairerId: newRepairerId,
            timestamp: new Date(),
        });

        return request;
    }

    /** User cancels request */
    @CreateRequestContext()
    async cancel(userId: string, requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.CANCELLED);
        const oldStatus = request.status;
        request.status = RepairRequestStatus.CANCELLED;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId,
            oldStatus,
            newStatus: RepairRequestStatus.CANCELLED,
            timestamp: new Date(),
        });

        return request;
    }

    // ── Queries ──

    @CreateRequestContext()
    async findByUser(userId: string, pagination: { offset?: number; limit?: number }): Promise<{ data: RepairRequest[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { userId },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findActiveByRepairer(repairerUserId: string): Promise<RepairRequest | null> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        return this.em.findOne(
            RepairRequest,
            {
                repairer: repairer.id,
                status: {
                    $in: [
                        RepairRequestStatus.ASSIGNED,
                        RepairRequestStatus.ACCEPTED,
                        RepairRequestStatus.IN_PROGRESS,
                        RepairRequestStatus.AWAITING_COMPLETION,
                    ],
                },
            },
            { populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'] },
        );
    }

    @CreateRequestContext()
    async findPausedByRepairer(repairerUserId: string, pagination: { offset?: number; limit?: number }): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { repairer: repairer.id, status: RepairRequestStatus.PAUSED },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findByRepairerFiltered(repairerUserId: string, pagination: { offset?: number; limit?: number }, status?: string): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const where: Record<string, any> = { repairer: repairer.id };
        if (status) where.status = status;

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            where,
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findByRepairer(repairerUserId: string, pagination: { offset?: number; limit?: number }): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { repairer: repairer.id },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findAll(pagination: { offset?: number; limit?: number }): Promise<{ data: RepairRequest[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findById(id: string): Promise<RepairRequest> {
        const request = await this.em.findOne(
            RepairRequest,
            { id },
            { populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'] }
        );
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        return request;
    }

    @CreateRequestContext()
    async checkActiveForDevice(userDeviceId: string): Promise<{ hasActive: boolean; request?: RepairRequest }> {
        const request = await this.em.findOne(RepairRequest, {
            userDevice: userDeviceId,
            status: {
                $nin: [
                    RepairRequestStatus.COMPLETED,
                    RepairRequestStatus.CANCELLED,
                    RepairRequestStatus.REFUNDED,
                    RepairRequestStatus.REFUSED,
                ],
            },
        });
        return { hasActive: !!request, request: request ?? undefined };
    }

    @CreateRequestContext()
    async setConversationId(requestId: string, conversationId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        request.conversationId = conversationId;
        await this.em.flush();
    }

    @CreateRequestContext()
    async findOpenChatsForClose(): Promise<{ requestId: string; conversationId: string }[]> {
        const requests = await this.em.find(RepairRequest, {
            status: RepairRequestStatus.COMPLETED,
            conversationId: { $ne: null },
            chatCloseAt: { $lte: new Date() },
        });
        return requests
            .filter(r => r.conversationId)
            .map(r => ({ requestId: r.id, conversationId: r.conversationId! }));
    }

    @CreateRequestContext()
    async clearChatCloseAt(requestId: string): Promise<string | undefined> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) return undefined;
        const conversationId = request.conversationId;
        request.chatCloseAt = undefined;
        await this.em.flush();
        return conversationId;
    }
}

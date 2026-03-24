import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { RepairRequest } from 'entities/repair-request.entity';
import { UserDevice } from 'entities/user-device.entity';
import { Certificate } from 'entities/certificate.entity';
import { Repairer } from 'entities/repairer.entity';
import { Address } from 'entities/address.entity';
import { RepairRequestStatus, CertificateStatus, PaymentTargetType } from '@asko/shared';
import { AppErrors } from 'common/error';
import { PaymentClientService } from 'modules/payment-client.service';

@Injectable()
export class RepairRequestService {
    constructor(
        private readonly em: EntityManager,
        private readonly paymentClient: PaymentClientService,
    ) {}

    /** User creates a repair request */
    async create(userId: string, dto: { userDeviceId: string; description: string; certificateId?: string; preferredDate?: string }): Promise<RepairRequest> {
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
        return request;
    }

    /** User requests refund */
    async requestRefund(userId: string, requestId: string, reason: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (request.status === RepairRequestStatus.COMPLETED || request.status === RepairRequestStatus.REFUNDED) {
            throw AppErrors.badRequest('Cannot request refund for this request');
        }

        request.refundRequested = true;
        request.refundReason = reason;
        request.status = RepairRequestStatus.REFUND_REQUESTED;
        await this.em.flush();
        return request;
    }

    /** Manager approves refund */
    async approveRefund(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.REFUND_REQUESTED) {
            throw AppErrors.badRequest('No refund request pending');
        }

        request.status = RepairRequestStatus.REFUNDED;

        // Refund via payment-service gRPC (external)
        const { payments } = await this.paymentClient.getPaymentsByTarget('repairRequest', requestId);
        const paidPayment = payments?.find(p => p.status === 'paid');
        if (paidPayment) {
            await this.paymentClient.refundPayment(paidPayment.id);
        }

        await this.em.flush();
        return request;
    }

    /** Manager denies refund */
    async denyRefund(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.REFUND_REQUESTED) {
            throw AppErrors.badRequest('No refund request pending');
        }

        request.refundRequested = false;
        request.status = RepairRequestStatus.PAID; // revert to paid
        await this.em.flush();
        return request;
    }

    /** Manager assigns repairer to request */
    async assignRepairer(managerId: string, requestId: string, repairerId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (![RepairRequestStatus.PENDING, RepairRequestStatus.PAID].includes(request.status)) {
            throw AppErrors.badRequest('Request must be in PENDING or PAID status to assign a repairer');
        }

        // Validate repairer directly
        const repairer = await this.em.findOne(Repairer, { id: repairerId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        if (!repairer.isActive) throw AppErrors.badRequest('Repairer is not active');

        request.repairer = this.em.getReference(Repairer, repairerId);
        request.managerId = managerId;
        request.status = RepairRequestStatus.ASSIGNED;
        await this.em.flush();
        return request;
    }

    /** Repairer accepts assigned request */
    async acceptRequest(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.ASSIGNED) {
            throw AppErrors.badRequest('Request is not in ASSIGNED status');
        }

        request.status = RepairRequestStatus.ACCEPTED;
        await this.em.flush();
        return request;
    }

    /** Repairer refuses assigned request - reverts to PAID so manager can re-assign */
    async refuseRequest(repairerUserId: string, requestId: string, reason: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.ASSIGNED) {
            throw AppErrors.badRequest('Request is not in ASSIGNED status');
        }

        // Track rejected repairer
        if (!request.rejectedRepairers) request.rejectedRepairers = [];
        request.rejectedRepairers.push(repairer.id);

        request.status = RepairRequestStatus.PAID;
        request.refuseReason = reason;
        request.repairer = undefined;
        await this.em.flush();

        return request;
    }

    /** Repairer starts working on request */
    async startWork(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.ACCEPTED) {
            throw AppErrors.badRequest('Request must be ACCEPTED first');
        }

        request.status = RepairRequestStatus.IN_PROGRESS;
        await this.em.flush();
        return request;
    }

    /** Repairer sets or updates repair price */
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

        // Create payment invoice for the user via payment-service (external)
        await this.paymentClient.createInvoice(
            request.userId,
            PaymentTargetType.REPAIR_REQUEST,
            request.id,
            amount,
        );

        return request;
    }

    /** Mark request as awaiting completion (last step done) */
    async markAwaitingCompletion(requestId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) return;
        request.status = RepairRequestStatus.AWAITING_COMPLETION;
        await this.em.flush();
    }

    /** Complete the request with optional description */
    async complete(requestId: string, description?: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (![RepairRequestStatus.AWAITING_COMPLETION, RepairRequestStatus.IN_PROGRESS].includes(request.status)) {
            throw AppErrors.badRequest('Request is not in a completable status');
        }
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

        await this.em.flush();
        return request;
    }

    /** User cancels request */
    async cancel(userId: string, requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if ([RepairRequestStatus.COMPLETED, RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.AWAITING_COMPLETION].includes(request.status)) {
            throw AppErrors.badRequest('Cannot cancel request in current status');
        }
        request.status = RepairRequestStatus.CANCELLED;
        await this.em.flush();
        return request;
    }

    // ── Queries ──

    async findByUser(userId: string, pagination: { offset?: number; limit?: number }): Promise<{ data: RepairRequest[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { userId },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['workSteps'],
            }
        );
        return { data, total };
    }

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
            { populate: ['workSteps'] },
        );
    }

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
                populate: ['workSteps'],
            }
        );
        return { data, total };
    }

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
                populate: ['workSteps'],
            }
        );
        return { data, total };
    }

    async findAll(pagination: { offset?: number; limit?: number }): Promise<{ data: RepairRequest[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['workSteps'],
            }
        );
        return { data, total };
    }

    async findById(id: string): Promise<RepairRequest> {
        const request = await this.em.findOne(
            RepairRequest,
            { id },
            { populate: ['workSteps'] }
        );
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        return request;
    }

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
}

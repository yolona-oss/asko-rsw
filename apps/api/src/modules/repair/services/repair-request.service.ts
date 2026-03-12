import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { RepairRequest, UserDevice, Certificate, Repairer, WorkStep, RepairPayment } from 'entities';
import {
    CreateRepairRequestDto,
    AssignRepairerDto,
    RefuseRequestDto,
    RequestRefundDto,
    RepairRequestStatus,
    CertificateStatus,
    PaymentStatus,
    WorkStepStatus,
    PaginationDto,
    Role,
    JwtPayload,
} from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class RepairRequestService {
    constructor(private readonly em: EntityManager) {}

    /** User creates a repair request */
    async create(userId: string, dto: CreateRepairRequestDto): Promise<RepairRequest> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId, user: userId }, { populate: ['address'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        let certificate: Certificate | undefined;
        if (dto.certificateId) {
            const cert = await this.em.findOne(Certificate, { id: dto.certificateId, user: userId });
            if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
            if (cert.status !== CertificateStatus.ACTIVE) {
                throw AppErrors.badRequest('Certificate is not active');
            }
            if (new Date() > cert.expiresAt) {
                throw AppErrors.badRequest('Certificate has expired');
            }
            certificate = cert;
        }

        const request = this.em.create(RepairRequest, {
            user: userId,
            userDevice: userDevice,
            certificate: certificate,
            description: dto.description,
            preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : undefined,
            address: userDevice.address,
            status: RepairRequestStatus.PENDING,
        });
        await this.em.persistAndFlush(request);
        return request;
    }

    /** User requests refund */
    async requestRefund(userId: string, requestId: string, dto: RequestRefundDto): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, user: userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (request.status === RepairRequestStatus.COMPLETED || request.status === RepairRequestStatus.REFUNDED) {
            throw AppErrors.badRequest('Cannot request refund for this request');
        }

        request.refundRequested = true;
        request.refundReason = dto.reason;
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

        // Mark payment as refunded
        const payment = await this.em.findOne(RepairPayment, { repairRequest: requestId, status: PaymentStatus.PAID });
        if (payment) {
            payment.status = PaymentStatus.REFUNDED;
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
    async assignRepairer(managerId: string, requestId: string, dto: AssignRepairerDto): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.PAID) {
            throw AppErrors.badRequest('Request must be in PAID status to assign a repairer');
        }

        const repairer = await this.em.findOne(Repairer, { id: dto.repairerId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        if (!repairer.isActive) throw AppErrors.badRequest('Repairer is not active');

        request.repairer = repairer;
        request.manager = this.em.getReference('User', managerId) as any;
        request.status = RepairRequestStatus.ASSIGNED;
        await this.em.flush();
        return request;
    }

    /** Repairer accepts assigned request */
    async acceptRequest(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
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

    /** Repairer refuses assigned request */
    async refuseRequest(repairerUserId: string, requestId: string, dto: RefuseRequestDto): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.ASSIGNED) {
            throw AppErrors.badRequest('Request is not in ASSIGNED status');
        }

        request.status = RepairRequestStatus.REFUSED;
        request.refuseReason = dto.reason;
        request.repairer = undefined;
        await this.em.flush();
        return request;
    }

    /** Repairer starts working on request */
    async startWork(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
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

    /** Mark request as awaiting completion (last step done) */
    async markAwaitingCompletion(requestId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) return;
        request.status = RepairRequestStatus.AWAITING_COMPLETION;
        await this.em.flush();
    }

    /** Complete the request */
    async complete(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['repairer', 'userDevice', 'userDevice.address'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.AWAITING_COMPLETION) {
            throw AppErrors.badRequest('Request is not awaiting completion');
        }

        request.status = RepairRequestStatus.COMPLETED;

        // Update repairer stats and location
        if (request.repairer) {
            const repairer = request.repairer;
            repairer.completedRepairs += 1;
            // Update repairer location to device address (requirement 3.5)
            if (request.userDevice?.address) {
                // We don't have lat/lng on Address entity, so just update the timestamp
                repairer.lastLocationUpdate = new Date();
            }
        }

        await this.em.flush();
        return request;
    }

    /** User cancels request */
    async cancel(userId: string, requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, user: userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if ([RepairRequestStatus.COMPLETED, RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.AWAITING_COMPLETION].includes(request.status)) {
            throw AppErrors.badRequest('Cannot cancel request in current status');
        }
        request.status = RepairRequestStatus.CANCELLED;
        await this.em.flush();
        return request;
    }

    // ── Queries ──

    async findByUser(userId: string, pagination: PaginationDto): Promise<{ data: RepairRequest[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { user: userId },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['userDevice', 'userDevice.device', 'repairer', 'certificate', 'workSteps'],
            }
        );
        return { data, total };
    }

    async findByRepairer(repairerUserId: string, pagination: PaginationDto): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { repairer: repairer.id },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['user', 'userDevice', 'userDevice.device', 'userDevice.address', 'certificate', 'workSteps'],
            }
        );
        return { data, total };
    }

    async findAll(pagination: PaginationDto): Promise<{ data: RepairRequest[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['user', 'userDevice', 'userDevice.device', 'repairer', 'repairer.user', 'certificate', 'workSteps'],
            }
        );
        return { data, total };
    }

    async findById(id: string): Promise<RepairRequest> {
        const request = await this.em.findOne(
            RepairRequest,
            { id },
            { populate: ['user', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'repairer.user', 'certificate', 'workSteps', 'address'] }
        );
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        return request;
    }
}

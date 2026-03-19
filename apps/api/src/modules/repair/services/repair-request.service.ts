import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { RepairRequest, UserDevice, Certificate, Repairer, RepairPayment } from 'entities';
import {
    CreateRepairRequestDto,
    AssignRepairerDto,
    RefuseRequestDto,
    RequestRefundDto,
    RepairRequestStatus,
    CertificateStatus,
    PaymentStatus,
    PaginationDto,
    SetRepairPriceDto,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { NotificationService } from 'modules/notification/services/common-notification.service';
import { ImageService } from 'modules/file-upload/services/image.service';
import { PaymentService } from 'modules/payment/services/payment.service';

@Injectable()
export class RepairRequestService {
    constructor(
        private readonly em: EntityManager,
        private readonly notificationService: NotificationService,
        private readonly imageService: ImageService,
        private readonly paymentService: PaymentService,
    ) { }

    /** User creates a repair request */
    async create(userId: string, dto: CreateRepairRequestDto): Promise<RepairRequest> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId, user: userId }, { populate: ['address'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

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

        // Refund via payment provider
        const payment = await this.em.findOne(RepairPayment, {
            targetType: 'repairRequest', targetId: requestId, status: PaymentStatus.PAID,
        });
        if (payment) {
            await this.paymentService.refundPayment(payment.id);
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
        if (![RepairRequestStatus.PENDING, RepairRequestStatus.PAID].includes(request.status)) {
            throw AppErrors.badRequest('Request must be in PENDING or PAID status to assign a repairer');
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

    /** Repairer refuses assigned request - reverts to PAID so manager can re-assign */
    async refuseRequest(repairerUserId: string, requestId: string, dto: RefuseRequestDto): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
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
        request.refuseReason = dto.reason;
        request.repairer = undefined;
        await this.em.flush();

        // Notify managers about refusal
        this.notificationService.notifyManagers({
            type: 'repairer_refused',
            requestId: request.id,
            repairerId: repairer.id,
            reason: dto.reason,
        });

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

    /** Repairer sets or updates repair price */
    async setPrice(repairerUserId: string, requestId: string, dto: SetRepairPriceDto): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (![RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.AWAITING_COMPLETION, RepairRequestStatus.COMPLETED].includes(request.status)) {
            throw AppErrors.badRequest('Price can only be set when request is in progress or completed');
        }

        request.totalCost = dto.amount;
        await this.em.flush();
        return request;
    }

    /** Mark request as awaiting completion (last step done) */
    async markAwaitingCompletion(requestId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) return;
        // if (!request.totalCost) {
        //     throw AppErrors.badRequest('Необходимо указать стоимость ремонта перед завершением');
        // }
        request.status = RepairRequestStatus.AWAITING_COMPLETION;
        await this.em.flush();
    }

    /** Complete the request with optional description and media files */
    async complete(requestId: string, description?: string, files?: Express.Multer.File[]): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['repairer', 'userDevice', 'userDevice.address'] });
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

        // Update repairer stats and location
        if (request.repairer) {
            const repairer = request.repairer;
            repairer.completedRepairs += 1;
            if (request.userDevice?.address) {
                repairer.lastLocationUpdate = new Date();
            }
        }

        await this.em.flush();

        // Upload completion images
        if (files && files.length > 0) {
            for (const file of files) {
                await this.imageService.uploadRepairRequestImage(file, requestId);
            }
        }

        // Notify user about completion
        this.notificationService.notifyRepairCompleted(String(request.user), {
            type: 'repair_completed',
            requestId: request.id,
        });

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

    async findActiveByRepairer(repairerUserId: string): Promise<RepairRequest | null> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
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
            { populate: ['user', 'userDevice', 'userDevice.device', 'userDevice.address', 'certificate', 'workSteps'] },
        );
    }

    async findByRepairerFiltered(repairerUserId: string, pagination: PaginationDto, status?: string): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
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
                populate: ['user', 'userDevice', 'userDevice.device', 'userDevice.address', 'certificate', 'workSteps'],
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

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Certificate, UserDevice, DealerProfile } from 'entities';
import {
    AddCertificateDto,
    CreateCertificateDto,
    CertificateStatus,
    RepairRequestStatus,
    generateCertificateNumber,
    PaginationDto,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { DealerService } from 'modules/dealer/services/dealer.service';

@Injectable()
export class CertificateService {
    constructor(
        private readonly em: EntityManager,
        @Inject(forwardRef(() => DealerService))
        private readonly dealerService: DealerService,
    ) {}

    /** User adds an existing certificate (purchased offline) */
    async addCertificate(userId: string, dto: AddCertificateDto): Promise<Certificate> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId, user: userId });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        const existing = await this.em.findOne(Certificate, { certificateNumber: dto.certificateNumber });
        if (existing) throw AppErrors.dbEntityExists('Certificate number already registered');

        const cert = this.em.create(Certificate, {
            user: userId,
            userDevice: userDevice,
            certificateNumber: dto.certificateNumber,
            status: CertificateStatus.PENDING_APPROVAL,
            expiresAt: new Date(dto.expiresAt),
        });
        await this.em.persistAndFlush(cert);
        return cert;
    }

    /** Dealer creates a certificate for a client's device */
    async createCertificateByDealer(dealerUserId: string, dto: CreateCertificateDto): Promise<Certificate> {
        const dealerProfile = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealerProfile) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId, user: dto.clientUserId }, { populate: ['user', 'device'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        const certNumber = generateCertificateNumber();

        const cert = this.em.create(Certificate, {
            user: dto.clientUserId,
            userDevice: userDevice,
            dealer: dealerProfile,
            certificateNumber: certNumber,
            status: CertificateStatus.PENDING_APPROVAL,
            expiresAt: new Date(dto.expiresAt),
            purchaseReceiptUrl: dto.purchaseReceiptUrl,
            description: dto.description,
        });
        await this.em.persistAndFlush(cert);
        return cert;
    }

    /** Admin approves a certificate. Awards dealer points if dealer-created. */
    async approveCertificate(certId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId }, { populate: ['dealer', 'user'] });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.status !== CertificateStatus.PENDING_APPROVAL) {
            throw AppErrors.badRequest('Certificate is not pending approval');
        }

        cert.status = CertificateStatus.ACTIVE;
        await this.em.flush();

        // If dealer-created, award points and link client
        if (cert.dealer) {
            await this.dealerService.awardPointsForCertificate(cert);
            await this.dealerService.linkClientOnCertificateApproval(cert);
        }

        return cert;
    }

    /** Admin revokes a certificate */
    async revokeCertificate(certId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        cert.status = CertificateStatus.REVOKED;
        await this.em.flush();
        return cert;
    }

    /** Reassign certificate to different device (only if no active repair uses it) */
    async reassignCertificate(userId: string, certId: string, userDeviceId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId, user: userId });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');

        // Check no active repair request is using this certificate
        const { RepairRequest } = await import('entities');
        const activeRepair = await this.em.findOne(RepairRequest, {
            certificate: certId,
            status: { $nin: [RepairRequestStatus.COMPLETED, RepairRequestStatus.CANCELLED, RepairRequestStatus.REFUNDED] },
        });
        if (activeRepair) throw AppErrors.badRequest('Certificate is in use by an active repair request');

        const newDevice = await this.em.findOne(UserDevice, { id: userDeviceId, user: userId });
        if (!newDevice) throw AppErrors.dbEntityNotFound('User device not found');

        cert.userDevice = newDevice;
        await this.em.flush();
        return cert;
    }

    async findByUser(userId: string): Promise<Certificate[]> {
        return this.em.find(Certificate, { user: userId }, { populate: ['userDevice', 'userDevice.device'] });
    }

    async findByDealer(dealerUserId: string): Promise<Certificate[]> {
        const dealer = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        return this.em.find(Certificate, { dealer: dealer.id }, { populate: ['user', 'userDevice', 'userDevice.device'] });
    }

    async findAll(pagination: PaginationDto): Promise<{ data: Certificate[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Certificate,
            pagination.search
                ? { certificateNumber: { $ilike: `%${pagination.search}%` } }
                : {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['user', 'userDevice', 'userDevice.device', 'dealer'],
            }
        );
        return { data, total };
    }

    async findById(id: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id }, { populate: ['user', 'userDevice', 'userDevice.device', 'dealer'] });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        return cert;
    }

    /** Find pending certificates (for admin approval queue) */
    async findPending(pagination: PaginationDto): Promise<{ data: Certificate[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Certificate,
            { status: CertificateStatus.PENDING_APPROVAL },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'ASC' },
                populate: ['user', 'userDevice', 'userDevice.device', 'dealer'],
            }
        );
        return { data, total };
    }
}

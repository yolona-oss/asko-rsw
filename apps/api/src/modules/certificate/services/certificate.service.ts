import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Certificate, UserDevice, DealerProfile, Device, Address, DealerClient, User } from 'entities';
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

/**
 * Calculate certificate price.
 * Formula: devicePrice * 0.3 * durationYears * 0.5
 * durationYears = (expiresAt - issuedAt) in fractional years
 */
function calculateCertificatePrice(devicePrice: number, issuedAt: Date, expiresAt: Date): number {
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const durationYears = (expiresAt.getTime() - issuedAt.getTime()) / msPerYear;
    if (durationYears <= 0) return 0;
    const price = devicePrice * 0.3 * durationYears * 0.5;
    return Math.round(price * 100) / 100; // round to 2 decimals
}

@Injectable()
export class CertificateService {
    constructor(
        private readonly em: EntityManager,
        @Inject(forwardRef(() => DealerService))
        private readonly dealerService: DealerService,
    ) {}

    /** User adds an existing certificate (purchased offline) */
    async addCertificate(userId: string, dto: AddCertificateDto): Promise<Certificate> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId, user: userId }, { populate: ['device'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        const existing = await this.em.findOne(Certificate, { certificateNumber: dto.certificateNumber });
        if (existing) throw AppErrors.dbEntityExists('Certificate number already registered');

        const issuedAt = new Date();
        const expiresAt = new Date(dto.expiresAt);
        const devicePrice = userDevice.device?.price ?? 0;
        const price = calculateCertificatePrice(devicePrice, issuedAt, expiresAt);

        const cert = this.em.create(Certificate, {
            user: userId,
            userDevice: userDevice,
            certificateNumber: dto.certificateNumber,
            status: CertificateStatus.PENDING_PAYMENT,
            issuedAt,
            expiresAt,
            price,
        });
        await this.em.persistAndFlush(cert);
        return cert;
    }

    /** Dealer creates a certificate for a client's device */
    async createCertificateByDealer(dealerUserId: string, dto: CreateCertificateDto): Promise<Certificate> {
        const dealerProfile = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealerProfile) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        const clientUser = await this.em.findOne(User, { id: dto.clientUserId });
        if (!clientUser) throw AppErrors.dbEntityNotFound('Client user not found');

        const device = await this.em.findOne(Device, { id: dto.deviceId });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found in catalog');

        // Create address for the device
        const address = this.em.create(Address, {
            country: dto.country,
            city: dto.city,
            street: dto.street,
            house: dto.house,
            building: dto.building,
            floor: dto.floor,
            room: dto.room,
            postalCode: dto.postalCode,
        });

        // Create UserDevice for the client
        const userDevice = this.em.create(UserDevice, {
            user: clientUser,
            device: device,
            serialNumber: dto.serialNumber,
            address: address,
        });

        // Link client to dealer
        const existingLink = await this.em.findOne(DealerClient, { dealer: dealerProfile.id, clientUser: dto.clientUserId });
        if (!existingLink) {
            const link = this.em.create(DealerClient, {
                dealer: dealerProfile,
                clientUser: clientUser,
            });
            this.em.persist(link);
        }

        const certNumber = generateCertificateNumber();

        const issuedAt = new Date();
        const expiresAt = new Date(dto.expiresAt);
        const devicePrice = device.price ?? 0;
        const price = calculateCertificatePrice(devicePrice, issuedAt, expiresAt);

        const cert = this.em.create(Certificate, {
            user: dto.clientUserId,
            userDevice: userDevice,
            dealer: dealerProfile,
            certificateNumber: certNumber,
            status: CertificateStatus.PENDING_PAYMENT,
            issuedAt,
            expiresAt,
            price,
            purchaseReceiptUrl: dto.purchaseReceiptUrl,
            description: dto.description,
        });

        await this.em.persist(address);
        await this.em.persist(userDevice);
        await this.em.persist(cert);
        await this.em.flush();
        return cert;
    }

    /** Admin approves a certificate. Awards dealer points if dealer-created. */
    async approveCertificate(certId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId }, { populate: ['dealer', 'user'] });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.status !== CertificateStatus.PENDING_APPROVAL) {
            throw AppErrors.badRequest('Certificate is not pending approval');
        }
        if (!cert.paid) {
            throw AppErrors.badRequest('Certificate must be paid before activation');
        }

        cert.status = CertificateStatus.ACTIVE;
        await this.em.flush();

        // If dealer-created, award points based on certificate price
        if (cert.dealer) {
            await this.dealerService.awardPointsForCertificate(cert);
            await this.dealerService.linkClientOnCertificateApproval(cert);
        }

        return cert;
    }

    /** Mark certificate as paid — called by payment handler */
    async markPaid(certId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.paid) throw AppErrors.badRequest('Certificate already paid');

        cert.paid = true;
        // Move from PENDING_PAYMENT to PENDING_APPROVAL
        if (cert.status === CertificateStatus.PENDING_PAYMENT) {
            cert.status = CertificateStatus.PENDING_APPROVAL;
        }
        await this.em.flush();
        return cert;
    }

    /** Calculate certificate price for a given device and expiry date */
    async calculatePrice(userDeviceId: string, expiresAt: string): Promise<{ price: number }> {
        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId }, { populate: ['device'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        const devicePrice = userDevice.device?.price ?? 0;
        const price = calculateCertificatePrice(devicePrice, new Date(), new Date(expiresAt));
        return { price };
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

    async findByDealer(dealerUserId: string, pagination?: PaginationDto, status?: CertificateStatus): Promise<{ data: Certificate[]; total: number }> {
        const dealer = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        const where: any = { dealer: dealer.id };
        if (pagination?.search) {
            where.certificateNumber = { $ilike: `%${pagination.search}%` };
        }
        if (status) {
            where.status = status;
        }

        const limit = pagination?.limit ?? 20;
        const offset = ((pagination?.offset ?? 1) - 1) * limit;

        const [data, total] = await this.em.findAndCount(Certificate, where, {
            limit,
            offset,
            orderBy: { createdAt: 'DESC' },
            populate: ['user', 'userDevice', 'userDevice.device'],
        });
        return { data, total };
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

import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Certificate } from 'entities/certificate.entity';
import { UserDevice } from 'entities/user-device.entity';
import { Device } from 'entities/device.entity';
import { DealerProfile } from 'entities/dealer-profile.entity';
import {
    CertificateStatus,
    PaymentTargetType,
    PointsTransactionType,
    generateCertificateNumber,
} from '@asko/shared';
import { PointsTransaction } from 'entities/points-transaction.entity';
import { AppErrors } from 'common/error';
import { PaymentCommandService } from 'modules/payment-command.service';

/** Certificate price = device price * years * 0.05. Minimum 1000. */
function calculateCertificatePrice(devicePrice: number, years: number): number {
    const base = devicePrice * years * 0.05;
    return Math.max(Math.round(base), 1000);
}

@Injectable()
export class CertificateService {
    constructor(
        private readonly em: EntityManager,
        private readonly paymentCommandService: PaymentCommandService,
    ) {}

    /** User adds an existing certificate (e.g. received with product) */
    @CreateRequestContext()
    async addCertificate(userId: string, dto: {
        userDeviceId: string;
        certificateNumber: string;
        expiresAt: string;
    }): Promise<Certificate> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId }, { populate: ['device'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        if (userDevice.userId !== userId) throw AppErrors.dbEntityNotFound('User device not found');

        // Check uniqueness
        const existing = await this.em.findOne(Certificate, { certificateNumber: dto.certificateNumber });
        if (existing) throw AppErrors.dbEntityExists('Certificate number already registered');

        const cert = this.em.create(Certificate, {
            userId,
            userDevice,
            certificateNumber: dto.certificateNumber,
            expiresAt: new Date(dto.expiresAt),
            status: CertificateStatus.ACTIVE,
            paid: true,
        });
        await this.em.persistAndFlush(cert);
        return cert;
    }

    /** Dealer creates a certificate for a client */
    @CreateRequestContext()
    async createByDealer(dto: {
        clientUserId: string;
        userDeviceId: string;
        dealerId: string;
        expiresAt: string;
        serialNumber: string;
        purchaseReceiptUrl?: string;
        description?: string;
    }): Promise<Certificate> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId }, { populate: ['device'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        const dealer = await this.em.findOne(DealerProfile, { id: dto.dealerId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        const certNumber = generateCertificateNumber();

        // Calculate price based on device and expiration
        const device = userDevice.device;
        const years = Math.max(1, Math.ceil(
            (new Date(dto.expiresAt).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000),
        ));
        const price = calculateCertificatePrice(device.price ?? 0, years);

        const cert = this.em.create(Certificate, {
            userId: dto.clientUserId,
            userDevice,
            dealer,
            certificateNumber: certNumber,
            expiresAt: new Date(dto.expiresAt),
            price,
            status: CertificateStatus.PENDING_PAYMENT,
            purchaseReceiptUrl: dto.purchaseReceiptUrl,
            description: dto.description,
        });
        await this.em.persistAndFlush(cert);

        // Create payment invoice via payment-service RabbitMQ (fire-and-forget)
        await this.paymentCommandService.emitCreateInvoice(
            dto.clientUserId,
            PaymentTargetType.CERTIFICATE,
            cert.id,
            price,
        );

        return cert;
    }

    /** Mark certificate as paid -> ACTIVE. Also award dealer points if applicable. */
    @CreateRequestContext()
    async markPaid(id: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id }, { populate: ['dealer'] });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.status !== CertificateStatus.PENDING_PAYMENT) {
            throw AppErrors.badRequest('Certificate is not pending payment');
        }

        cert.status = CertificateStatus.ACTIVE;
        cert.paid = true;

        // Award dealer points if certificate was created by dealer
        if (cert.dealer && cert.price) {
            const points = Math.round(cert.price * 0.03);
            if (points > 0) {
                cert.dealer.pointsBalance += points;

                const transaction = this.em.create(PointsTransaction, {
                    dealer: cert.dealer,
                    type: PointsTransactionType.EARNED,
                    amount: points,
                    reason: `Certificate ${cert.certificateNumber} approved (price: ${cert.price})`,
                });
                this.em.persist(transaction);
            }
        }

        await this.em.flush();
        return cert;
    }

    /** Admin revokes a certificate */
    @CreateRequestContext()
    async revokeCertificate(id: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.status === CertificateStatus.REVOKED) {
            throw AppErrors.badRequest('Certificate is already revoked');
        }

        cert.status = CertificateStatus.REVOKED;
        await this.em.flush();
        return cert;
    }

    /** User reassigns certificate to a different device */
    @CreateRequestContext()
    async reassignCertificate(userId: string, certId: string, userDeviceId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.userId !== userId) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.status !== CertificateStatus.ACTIVE) {
            throw AppErrors.badRequest('Can only reassign active certificates');
        }

        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        if (userDevice.userId !== userId) throw AppErrors.dbEntityNotFound('User device not found');

        cert.userDevice = userDevice;
        await this.em.flush();
        return cert;
    }

    /** Calculate price for a certificate (no DB write) */
    @CreateRequestContext()
    async calculatePrice(userDeviceId: string, expiresAt: string): Promise<{ price: number; devicePrice: number; years: number }> {
        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId }, { populate: ['device'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        const devicePrice = userDevice.device.price ?? 0;
        const years = Math.max(1, Math.ceil(
            (new Date(expiresAt).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000),
        ));
        const price = calculateCertificatePrice(devicePrice, years);

        return { price, devicePrice, years };
    }

    // ── Queries ─────────────────────────────────────────────────────────

    @CreateRequestContext()
    async findById(id: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id }, { populate: ['userDevice', 'userDevice.device', 'dealer'] });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        return cert;
    }

    @CreateRequestContext()
    async findByUser(userId: string): Promise<Certificate[]> {
        return this.em.find(Certificate, { userId }, {
            populate: ['userDevice', 'userDevice.device', 'dealer'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    @CreateRequestContext()
    async findByDealer(dealerId: string, pagination: { offset?: number; limit?: number; search?: string }, status?: string): Promise<{ data: Certificate[]; total: number }> {
        const where: Record<string, any> = { dealer: dealerId };
        if (status) where.status = status;
        if (pagination.search) {
            where.$or = [
                { certificateNumber: { $ilike: `%${pagination.search}%` } },
            ];
        }

        const limit = pagination.limit ?? 20;
        const offset = ((pagination.offset ?? 1) - 1) * limit;

        const [data, total] = await this.em.findAndCount(Certificate, where, {
            limit,
            offset,
            orderBy: { createdAt: 'DESC' },
            populate: ['userDevice', 'userDevice.device'],
        });
        return { data, total };
    }

    @CreateRequestContext()
    async findAll(pagination: { offset?: number; limit?: number; search?: string }): Promise<{ data: Certificate[]; total: number }> {
        const where: Record<string, any> = {};
        if (pagination.search) {
            where.$or = [
                { certificateNumber: { $ilike: `%${pagination.search}%` } },
            ];
        }

        const limit = pagination.limit ?? 20;
        const offset = ((pagination.offset ?? 1) - 1) * limit;

        const [data, total] = await this.em.findAndCount(Certificate, where, {
            limit,
            offset,
            orderBy: { createdAt: 'DESC' },
            populate: ['userDevice', 'userDevice.device', 'dealer'],
        });
        return { data, total };
    }

    @CreateRequestContext()
    async validateCertificate(certificateNumber: string): Promise<{ valid: boolean; certificate?: Certificate; reason?: string }> {
        const cert = await this.em.findOne(Certificate, { certificateNumber }, {
            populate: ['userDevice', 'userDevice.device'],
        });
        if (!cert) return { valid: false, reason: 'Certificate not found' };
        if (cert.status === CertificateStatus.REVOKED) return { valid: false, certificate: cert, reason: 'Certificate is revoked' };
        if (cert.status === CertificateStatus.EXPIRED) return { valid: false, certificate: cert, reason: 'Certificate has expired' };
        if (new Date() > cert.expiresAt) return { valid: false, certificate: cert, reason: 'Certificate has expired' };
        if (!cert.paid) return { valid: false, certificate: cert, reason: 'Certificate is not paid' };

        return { valid: true, certificate: cert };
    }
}

import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Certificate } from 'entities/certificate.entity';
import {
    CertificateStatus,
    PaymentTargetType,
    generateCertificateNumber,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { DeviceClientService } from 'modules/device-client.service';
import { PaymentClientService } from 'modules/payment-client.service';
import { ExternalCertValidationService } from './external-cert-validation.service';

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
        private readonly deviceClient: DeviceClientService,
        private readonly paymentClient: PaymentClientService,
        private readonly externalCertValidation: ExternalCertValidationService,
    ) {}

    /** User adds an existing certificate */
    async addCertificate(userId: string, userDeviceId: string, certificateNumber: string, expiresAt: string): Promise<Certificate> {
        // Validate user device exists via device-service
        const udRes = await this.deviceClient.findUserDeviceById(userDeviceId);
        if (!udRes?.userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        const existing = await this.em.findOne(Certificate, { certificateNumber });
        if (existing) throw AppErrors.dbEntityExists('Certificate number already registered');

        // Validate serial number against external factory database
        const serialNumber = udRes.userDevice.serialNumber;
        try {
            await this.externalCertValidation.externalFactorySerialNumberValidator(serialNumber);
        } catch {
            const cert = this.em.create(Certificate, {
                userId,
                userDeviceId,
                certificateNumber,
                status: CertificateStatus.VALIDATION_ERROR,
                issuedAt: new Date(),
                expiresAt: new Date(expiresAt),
            });
            await this.em.persistAndFlush(cert);
            throw AppErrors.badRequest('Device serial number validation failed. Certificate marked with validation error.');
        }

        const issuedAt = new Date();
        const expiresAtDate = new Date(expiresAt);

        // Get device price from device-service
        const deviceId = udRes.userDevice.deviceId;
        const priceRes = await this.deviceClient.getDevicePrice(deviceId);
        const devicePrice = priceRes?.price ?? 0;
        const price = calculateCertificatePrice(devicePrice, issuedAt, expiresAtDate);

        const cert = this.em.create(Certificate, {
            userId,
            userDeviceId,
            certificateNumber,
            status: CertificateStatus.PENDING_PAYMENT,
            issuedAt,
            expiresAt: expiresAtDate,
            price,
        });
        await this.em.persistAndFlush(cert);

        // Create payment invoice via payment-service
        await this.paymentClient.createInvoice(
            userId,
            PaymentTargetType.CERTIFICATE,
            cert.id,
            price,
        );

        return cert;
    }

    /** Dealer creates a certificate for a client's device (receives pre-resolved IDs from gateway) */
    async createByDealer(
        clientUserId: string,
        userDeviceId: string,
        dealerId: string,
        expiresAt: string,
        serialNumber: string,
        purchaseReceiptUrl?: string,
        description?: string,
    ): Promise<Certificate> {
        // Validate serial number against external factory database
        try {
            await this.externalCertValidation.externalFactorySerialNumberValidator(serialNumber);
        } catch {
            const cert = this.em.create(Certificate, {
                userId: clientUserId,
                userDeviceId,
                dealerId,
                certificateNumber: generateCertificateNumber(),
                status: CertificateStatus.VALIDATION_ERROR,
                issuedAt: new Date(),
                expiresAt: new Date(expiresAt),
                purchaseReceiptUrl,
                description,
            });
            await this.em.persistAndFlush(cert);
            throw AppErrors.badRequest('Device serial number validation failed. Certificate marked with validation error.');
        }

        const certNumber = generateCertificateNumber();
        const issuedAt = new Date();
        const expiresAtDate = new Date(expiresAt);

        // Get device price from device-service via the user device
        const udRes = await this.deviceClient.findUserDeviceById(userDeviceId);
        const deviceId = udRes?.userDevice?.deviceId;
        let devicePrice = 0;
        if (deviceId) {
            const priceRes = await this.deviceClient.getDevicePrice(deviceId);
            devicePrice = priceRes?.price ?? 0;
        }
        const price = calculateCertificatePrice(devicePrice, issuedAt, expiresAtDate);

        const cert = this.em.create(Certificate, {
            userId: clientUserId,
            userDeviceId,
            dealerId,
            certificateNumber: certNumber,
            status: CertificateStatus.PENDING_PAYMENT,
            issuedAt,
            expiresAt: expiresAtDate,
            price,
            purchaseReceiptUrl,
            description,
        });
        await this.em.persistAndFlush(cert);

        // Create payment invoice for the client user via payment-service
        await this.paymentClient.createInvoice(
            clientUserId,
            PaymentTargetType.CERTIFICATE,
            cert.id,
            price,
        );

        return cert;
    }

    /**
     * Mark certificate as paid - called by payment handler.
     * After payment, certificate goes directly to ACTIVE (no admin approval needed).
     * Dealer points orchestration is handled by the gateway.
     */
    async markPaid(certId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        if (cert.paid) throw AppErrors.badRequest('Certificate already paid');

        cert.paid = true;
        // Move from PENDING_PAYMENT directly to ACTIVE
        if (cert.status === CertificateStatus.PENDING_PAYMENT) {
            cert.status = CertificateStatus.ACTIVE;
        }
        await this.em.flush();

        return cert;
    }

    /** Calculate certificate price for a given device and expiry date */
    async calculatePrice(userDeviceId: string, expiresAt: string): Promise<{ price: number }> {
        const udRes = await this.deviceClient.findUserDeviceById(userDeviceId);
        if (!udRes?.userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        const deviceId = udRes.userDevice.deviceId;
        const priceRes = await this.deviceClient.getDevicePrice(deviceId);
        const devicePrice = priceRes?.price ?? 0;
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

    /** Reassign certificate to different device */
    async reassignCertificate(userId: string, certId: string, userDeviceId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId, userId });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');

        // Validate new user device exists via device-service
        const udRes = await this.deviceClient.findUserDeviceById(userDeviceId);
        if (!udRes?.userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        cert.userDeviceId = userDeviceId;
        await this.em.flush();
        return cert;
    }

    async findByUser(userId: string): Promise<Certificate[]> {
        return this.em.find(Certificate, { userId });
    }

    async findByDealer(
        dealerId: string,
        pagination?: { offset?: number; limit?: number; search?: string },
        status?: string,
    ): Promise<{ data: Certificate[]; total: number }> {
        const where: any = { dealerId };
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
        });
        return { data, total };
    }

    async findAll(pagination: { offset?: number; limit?: number; search?: string }): Promise<{ data: Certificate[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Certificate,
            pagination.search
                ? { certificateNumber: { $ilike: `%${pagination.search}%` } }
                : {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
            }
        );
        return { data, total };
    }

    async findById(id: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id });
        if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
        return cert;
    }

    /** Validate a certificate by its number */
    async validateCertificate(certificateNumber: string): Promise<{ valid: boolean; certificate?: Certificate }> {
        const cert = await this.em.findOne(Certificate, { certificateNumber });
        if (!cert) {
            return { valid: false };
        }
        const isValid = cert.status === CertificateStatus.ACTIVE && cert.expiresAt > new Date();
        return { valid: isValid, certificate: cert };
    }
}

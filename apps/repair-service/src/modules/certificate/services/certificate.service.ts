import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Certificate } from 'modules/certificate/entities/certificate.entity';
import { UserDevice } from 'modules/device/entities/user-device.entity';
import { DealerProfile } from 'modules/dealer/entities/dealer-profile.entity';
import { RepairRequest } from 'modules/repair-request/entities/repair-request.entity';
import {
    CertificateStatus,
    PaymentTargetType,
    PointsTransactionType,
    RepairRequestStatus,
    computeExpiresAt,
    generateCertificateNumber,
} from '@asko/shared';
import { PointsTransaction } from 'modules/dealer/entities/points-transaction.entity';
import { msg } from '@asko/shared';
import { AppErrors } from 'common/error';
import { assertUserDeviceReady, ValidationCache } from 'common/validation';
import { PaymentCommandService } from 'modules/payment-command.service';
import { PaidPaymentService } from 'modules/shared-services/services/paid-payment.service';
import { SignatureService } from 'modules/shared-services/services/signature.service';
import { CertificatePdfService } from './certificate-pdf.service';
import { buildCertIntegrityChain, type IntegrityFailReason, type CertIntegrityContext } from '../validation';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';

const STATUS_LABELS: Record<string, string> = {
    pending_payment: 'Ожидает оплаты',
    active: 'Активен',
    expired: 'Истек',
    revoked: 'Отозван',
    validation_error: 'Ошибка валидации',
};

const CERT_SORTABLE_FIELDS = ['createdAt', 'issuedAt', 'expiresAt', 'status', 'certificateNumber'] as const;

/** Certificate price = device price * years * 0.05. Minimum 1000. */
function calculateCertificatePrice(devicePrice: number, years: number): number {
    const base = devicePrice * years * 0.05;
    return Math.max(Math.round(base), 1000);
}

@Injectable()
export class CertificateService {
    private readonly integrityCache = new ValidationCache<{ ok: true } | { ok: false; reason: IntegrityFailReason }>(30_000);

    constructor(
        private readonly em: EntityManager,
        private readonly paymentCommandService: PaymentCommandService,
        private readonly paidPayments: PaidPaymentService,
        private readonly signatureService: SignatureService,
        private readonly certificatePdfService: CertificatePdfService,
        private readonly repairEvents: RepairEventService,
    ) {}

    /** User adds an existing certificate (e.g. received with product) */
    @CreateRequestContext()
    async addCertificate(userId: string, dto: {
        userDeviceId: string;
        certificateNumber: string;
        expiresAt: string;
    }): Promise<Certificate> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId }, { populate: ['device', 'address'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });
        if (userDevice.userId !== userId) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });

        // Validate device + address
        assertUserDeviceReady(userDevice);

        // Check uniqueness
        const existing = await this.em.findOne(Certificate, { certificateNumber: dto.certificateNumber });
        if (existing) throw AppErrors.dbEntityExists({ key: msg.certificate.numberExists });

        const cert = this.em.create(Certificate, {
            userId,
            userDevice,
            certificateNumber: dto.certificateNumber,
            expiresAt: new Date(dto.expiresAt),
            status: CertificateStatus.ACTIVE,
            paid: true,
        });
        await this.em.persistAndFlush(cert);

        // Sign certificate data
        const payload = {
            certificateNumber: cert.certificateNumber,
            userId: cert.userId,
            userDeviceId: userDevice.id,
            issuedAt: cert.issuedAt.toISOString(),
            expiresAt: cert.expiresAt.toISOString(),
            signedAt: new Date().toISOString(),
        };
        cert.signedPayload = JSON.stringify(payload, Object.keys(payload).sort());
        cert.signature = this.signatureService.sign(payload);
        await this.em.flush();

        return cert;
    }

    /** User creates a certificate for their own device — invoice emitted, cert starts PENDING_PAYMENT. */
    @CreateRequestContext()
    async selfCreate(userId: string, dto: {
        userDeviceId: string;
        expiresAt: string;
        description?: string;
    }): Promise<Certificate> {
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId }, { populate: ['device', 'address'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });
        if (userDevice.userId !== userId) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });

        // Validate device + address
        assertUserDeviceReady(userDevice);

        const certNumber = generateCertificateNumber();

        const device = userDevice.device;
        const years = Math.max(1, Math.ceil(
            (new Date(dto.expiresAt).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000),
        ));
        const price = calculateCertificatePrice(device.price ?? 0, years);

        const cert = this.em.create(Certificate, {
            userId,
            userDevice,
            certificateNumber: certNumber,
            expiresAt: new Date(dto.expiresAt),
            price,
            status: CertificateStatus.PENDING_PAYMENT,
            description: dto.description,
        });
        await this.em.persistAndFlush(cert);

        await this.paymentCommandService.emitCreateInvoice(
            userId,
            PaymentTargetType.CERTIFICATE,
            cert.id,
            price,
        );

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
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId }, { populate: ['device', 'address'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });

        // Validate device + address
        assertUserDeviceReady(userDevice);

        const dealer = await this.em.findOne(DealerProfile, { id: dto.dealerId });
        if (!dealer) throw AppErrors.dbEntityNotFound({ key: msg.dealer.profileNotFound });

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

    /** Mark certificate as paid -> ACTIVE. Also award dealer points if applicable.
     *  If this cert replaces a prior one (reapply flow), the prior cert is
     *  transactionally flipped to EXPIRED in the same flush. */
    @CreateRequestContext()
    async markPaid(id: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id }, { populate: ['dealer', 'replacedCertificate'] });
        if (!cert) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        if (cert.status !== CertificateStatus.PENDING_PAYMENT) {
            throw AppErrors.badRequest({ key: msg.certificate.notPendingPayment });
        }

        cert.status = CertificateStatus.ACTIVE;
        cert.paid = true;
        cert.pdfDocumentId = undefined;
        this.integrityCache.invalidate(cert.id);

        if (cert.replacedCertificate && typeof cert.replacedCertificate === 'object') {
            const prior = cert.replacedCertificate;
            if (prior.status === CertificateStatus.ACTIVE) {
                prior.status = CertificateStatus.EXPIRED;
                this.integrityCache.invalidate(prior.id);
            }
        }

        // Sign certificate data
        const userDeviceId = typeof cert.userDevice === 'object' ? cert.userDevice.id : String(cert.userDevice);
        const payload = {
            certificateNumber: cert.certificateNumber,
            userId: cert.userId,
            userDeviceId,
            issuedAt: cert.issuedAt.toISOString(),
            expiresAt: cert.expiresAt.toISOString(),
            signedAt: new Date().toISOString(),
        };
        cert.signedPayload = JSON.stringify(payload, Object.keys(payload).sort());
        cert.signature = this.signatureService.sign(payload);

        // Award dealer points if certificate was created by dealer (idempotent)
        if (cert.dealer && cert.price && !cert.pointsAwarded) {
            const points = Math.round(cert.price * 0.03);
            if (points > 0) {
                // Pessimistic lock on dealer row to prevent concurrent balance drift
                await this.em.getConnection().execute(
                    `select 1 from "dealer_profile" where "id" = ? for update`,
                    [cert.dealer.id],
                );
                // Re-read balance after lock
                await this.em.refresh(cert.dealer);

                cert.dealer.pointsBalance += points;
                cert.pointsAwarded = true;

                const transaction = this.em.create(PointsTransaction, {
                    dealer: cert.dealer,
                    type: PointsTransactionType.EARNED,
                    amount: points,
                    reason: `Certificate ${cert.certificateNumber} approved (price: ${cert.price})`,
                });
                this.em.persist(transaction);
            }
        }

        // Flip certificateValid=true on any open repair requests that were created with
        // this cert while it was still unpaid — the cert is now effectively "applied".
        const openRequests = await this.em.find(RepairRequest, {
            certificate: cert.id,
            certificateValid: false,
            status: {
                $nin: [
                    RepairRequestStatus.COMPLETED,
                    RepairRequestStatus.CANCELLED,
                    RepairRequestStatus.REFUNDED,
                    RepairRequestStatus.REFUSED,
                ],
            },
        });
        for (const req of openRequests) {
            req.certificateValid = true;
            if (!req.certificateCostOverridden) {
                req.totalCost = 0;
                req.certificateCoveredCost = true;
            }
        }

        // Auto-attach newly paid cert to open repair requests for the same device
        // that were created without a cert — covers "user creates request, then buys
        // cert before completion". Post-completion purchases are excluded by status filter.
        const unattachedRequests = await this.em.find(RepairRequest, {
            userId: cert.userId,
            userDevice: userDeviceId,
            certificate: null,
            status: {
                $nin: [
                    RepairRequestStatus.COMPLETED,
                    RepairRequestStatus.CANCELLED,
                    RepairRequestStatus.REFUNDED,
                    RepairRequestStatus.REFUSED,
                ],
            },
        });
        for (const req of unattachedRequests) {
            req.certificate = cert;
            req.certificateValid = true;
            req.totalCost = 0;
            req.certificateCoveredCost = true;
            req.certificateCostOverridden = false;
        }

        await this.em.flush();
        return cert;
    }

    /**
     * User reapplies (renews) a certificate for the same device.
     *
     * Rather than mutating the source cert's expiresAt (which would force
     * re-signing a mutable row and make pricing awkward), we create a brand-new
     * PENDING_PAYMENT cert that references the source via replacedCertificate FK.
     * On markPaid() of the new cert we transactionally flip the source cert
     * from ACTIVE to EXPIRED.
     *
     * Guards (in order):
     *   - source cert exists and belongs to caller
     *   - source cert is not REVOKED
     *   - timing: source is EXPIRED (any time), OR ACTIVE within 30d of expiry
     *   - no open PENDING_PAYMENT reapply already exists for the same device
     */
    @CreateRequestContext()
    async reapplyCertificate(userId: string, sourceCertId: string, dto: {
        durationMonths: number;
        description?: string;
    }): Promise<Certificate> {
        const source = await this.em.findOne(Certificate, { id: sourceCertId }, {
            populate: ['userDevice', 'userDevice.device'],
        });
        if (!source) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        if (source.userId !== userId) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        if (source.status === CertificateStatus.REVOKED) {
            throw AppErrors.badRequest({ key: msg.certificate.cannotReapplyRevoked });
        }

        const now = new Date();
        const isExpired = source.status === CertificateStatus.EXPIRED || now >= source.expiresAt;
        if (!isExpired) {
            const reapplyWindowStart = new Date(source.expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (now < reapplyWindowStart) {
                throw AppErrors.badRequest({ key: msg.certificate.reapplyWindowExpired });
            }
        }

        const userDevice = typeof source.userDevice === 'object' ? source.userDevice : null;
        if (!userDevice) throw AppErrors.badRequest({ key: msg.certificate.noDevice });

        const pendingForDevice = await this.em.findOne(Certificate, {
            userDevice: userDevice.id,
            status: CertificateStatus.PENDING_PAYMENT,
        });
        if (pendingForDevice) {
            throw AppErrors.dbEntityExists({ key: msg.certificate.pendingExists });
        }

        const certNumber = generateCertificateNumber();
        const expiresAt = computeExpiresAt(dto.durationMonths);
        const years = Math.max(1, Math.ceil(dto.durationMonths / 12));
        const price = calculateCertificatePrice(userDevice.device.price ?? 0, years);

        const cert = this.em.create(Certificate, {
            userId,
            userDevice,
            certificateNumber: certNumber,
            expiresAt,
            price,
            status: CertificateStatus.PENDING_PAYMENT,
            description: dto.description,
            replacedCertificate: source,
        });
        await this.em.persistAndFlush(cert);

        await this.paymentCommandService.emitCreateInvoice(
            userId,
            PaymentTargetType.CERTIFICATE,
            cert.id,
            price,
        );

        return cert;
    }

    /** User dismisses the "expiring soon" reminder for a certificate. Does not
     *  expire the cert — just stops the cron from nagging again. */
    @CreateRequestContext()
    async dismissExpiryReminder(userId: string, certId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId });
        if (!cert) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        if (cert.userId !== userId) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });

        cert.expiryReminderDismissed = true;
        await this.em.flush();
        return cert;
    }

    /** Admin revokes a certificate */
    @CreateRequestContext()
    async revokeCertificate(id: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id });
        if (!cert) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        if (cert.status === CertificateStatus.REVOKED) {
            throw AppErrors.badRequest({ key: msg.certificate.alreadyRevoked });
        }

        cert.status = CertificateStatus.REVOKED;
        cert.pdfDocumentId = undefined;
        this.integrityCache.invalidate(cert.id);
        await this.em.flush();
        return cert;
    }

    /** User reassigns certificate to a different device */
    @CreateRequestContext()
    async reassignCertificate(userId: string, certId: string, userDeviceId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId });
        if (!cert) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        if (cert.userId !== userId) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        if (cert.status !== CertificateStatus.ACTIVE) {
            throw AppErrors.badRequest({ key: msg.certificate.onlyActiveReassign });
        }

        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId });
        if (!userDevice) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });
        if (userDevice.userId !== userId) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });

        cert.userDevice = userDevice;
        cert.pdfDocumentId = undefined;
        await this.em.flush();
        return cert;
    }

    /** Calculate price for a certificate (no DB write) */
    @CreateRequestContext()
    async calculatePrice(userDeviceId: string, expiresAt: string): Promise<{ price: number; devicePrice: number; years: number }> {
        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId }, { populate: ['device'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound({ key: msg.repair.userDeviceNotFound });

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
        if (!cert) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
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
    async findByDealer(dealerId: string, pagination: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }, status?: string): Promise<{ data: Certificate[]; total: number }> {
        const where: Record<string, any> = { dealer: dealerId };
        if (status) where.status = status.includes(",") ? { $in: status.split(",") } : status;
        if (pagination.search) {
            where.$or = [
                { certificateNumber: { $ilike: `%${pagination.search}%` } },
            ];
        }
        if (pagination.dateFrom || pagination.dateTo) {
            where.createdAt = {};
            if (pagination.dateFrom) where.createdAt.$gte = new Date(pagination.dateFrom);
            if (pagination.dateTo) where.createdAt.$lte = new Date(pagination.dateTo);
        }

        const limit = pagination.limit ?? 20;
        const offset = ((pagination.page ?? 1) - 1) * limit;

        const orderBy: Record<string, 'ASC' | 'DESC'> = pagination.sortBy && (CERT_SORTABLE_FIELDS as readonly string[]).includes(pagination.sortBy)
            ? { [pagination.sortBy]: pagination.sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [data, total] = await this.em.findAndCount(Certificate, where, {
            limit,
            offset,
            orderBy,
            populate: ['userDevice', 'userDevice.device', 'dealer'],
        });
        return { data, total };
    }

    @CreateRequestContext()
    async findAll(pagination: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }, status?: string): Promise<{ data: Certificate[]; total: number }> {
        const where: Record<string, any> = {};
        if (status) where.status = status.includes(",") ? { $in: status.split(",") } : status;
        if (pagination.search) {
            where.$or = [
                { certificateNumber: { $ilike: `%${pagination.search}%` } },
            ];
        }
        if (pagination.dateFrom || pagination.dateTo) {
            where.createdAt = {};
            if (pagination.dateFrom) where.createdAt.$gte = new Date(pagination.dateFrom);
            if (pagination.dateTo) where.createdAt.$lte = new Date(pagination.dateTo);
        }

        const limit = pagination.limit ?? 20;
        const offset = ((pagination.page ?? 1) - 1) * limit;

        const orderBy: Record<string, 'ASC' | 'DESC'> = pagination.sortBy && (CERT_SORTABLE_FIELDS as readonly string[]).includes(pagination.sortBy)
            ? { [pagination.sortBy]: pagination.sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [data, total] = await this.em.findAndCount(Certificate, where, {
            limit,
            offset,
            orderBy,
            populate: ['userDevice', 'userDevice.device', 'dealer'],
        });
        return { data, total };
    }

    @CreateRequestContext()
    async validateCertificate(
        certificateNumber: string,
    ): Promise<{ valid: boolean; certificate?: Certificate; reason?: string }> {
        const cert = await this.em.findOne(Certificate, { certificateNumber }, {
            populate: ['userDevice', 'userDevice.device'],
        });
        if (!cert) return { valid: false, reason: 'Certificate not found' };

        const result = await this.verifyCertificateIntegrity(cert);
        if (!result.ok) {
            return { valid: false, certificate: cert, reason: INTEGRITY_REASON_MESSAGES[result.reason] };
        }
        return { valid: true, certificate: cert };
    }

    /**
     * Strict cert check used by the repair-request creation path.
     * Returns a discriminated result so callers can decide whether to:
     *   - hard-throw (data integrity violations: not_found / wrong_user / wrong_device)
     *   - soft-flag the request (everything else — see verifyCertificateIntegrity)
     * Kept separate from validateCertificate(certificateNumber) which is the
     * public gRPC API and returns a loose { valid, reason } shape.
     */
    async validateCertificateForRequest(
        certId: string,
        userId: string,
        userDeviceId: string,
    ): Promise<
        | { ok: true; certificate: Certificate }
        | {
            ok: false;
            reason: 'not_found' | 'wrong_user' | 'wrong_device' | IntegrityFailReason;
            certificate?: Certificate;
          }
    > {
        const cert = await this.em.findOne(Certificate, { id: certId }, { populate: ['userDevice'] });
        if (!cert) return { ok: false, reason: 'not_found' };
        if (cert.userId !== userId) return { ok: false, reason: 'wrong_user', certificate: cert };

        const certDeviceId = typeof cert.userDevice === 'object' ? cert.userDevice.id : String(cert.userDevice);
        if (certDeviceId !== userDeviceId) return { ok: false, reason: 'wrong_device', certificate: cert };

        const integrity = await this.verifyCertificateIntegrity(cert);
        if (!integrity.ok) {
            this.repairEvents.emitCertificateIntegrityEvent({
                type: RepairEventType.CERTIFICATE_INTEGRITY_FAILED,
                certificateId: cert.id,
                certificateNumber: cert.certificateNumber,
                userId,
                failReason: integrity.reason,
                timestamp: new Date(),
            }).catch((e) => console.error('[CertificateService] Failed to emit integrity event:', e));
            return { ok: false, reason: integrity.reason, certificate: cert };
        }

        return { ok: true, certificate: cert };
    }

    /**
     * Shared cert integrity check via Chain of Responsibility.
     * Results cached for 30s to avoid repeated crypto + DB work on retries.
     */
    private async verifyCertificateIntegrity(
        cert: Certificate,
    ): Promise<{ ok: true } | { ok: false; reason: IntegrityFailReason }> {
        const cached = this.integrityCache.get(cert.id);
        if (cached) return cached;

        const chain = buildCertIntegrityChain(this.signatureService, this.paidPayments);
        const ctx: CertIntegrityContext = {
            certId: cert.id,
            status: cert.status,
            paid: !!cert.paid,
            expiresAt: cert.expiresAt,
            signedPayload: cert.signedPayload,
            signature: cert.signature,
            price: cert.price ?? null,
            invalid: false,
        };

        await chain.handle(ctx);

        const result: { ok: true } | { ok: false; reason: IntegrityFailReason } = ctx.invalid
            ? { ok: false, reason: ctx.failReason! }
            : { ok: true };

        this.integrityCache.set(cert.id, result);
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PDF Generation
    // ═══════════════════════════════════════════════════════════════════════

    @CreateRequestContext()
    async generatePdf(certId: string, deviceData: {
        deviceName: string;
        deviceBrand: string;
        deviceModel: string;
        deviceDescription: string;
        deviceImage?: Buffer;
    }): Promise<{ pdfBuffer: Buffer; certificate: Certificate }> {
        const cert = await this.em.findOne(Certificate, { id: certId }, {
            populate: ['userDevice', 'userDevice.device'],
        });
        if (!cert) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });

        const durationMs = cert.expiresAt.getTime() - cert.issuedAt.getTime();
        const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

        const pdfBuffer = await this.certificatePdfService.generate({
            certificateNumber: cert.certificateNumber,
            deviceName: deviceData.deviceName,
            deviceBrand: deviceData.deviceBrand,
            deviceModel: deviceData.deviceModel,
            deviceDescription: deviceData.deviceDescription || 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.\nСертификат подтверждает право на обслуживание и ремонт.',
            issuedAt: cert.issuedAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            expiresAt: cert.expiresAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
            durationMonths,
            status: cert.status,
            statusLabel: STATUS_LABELS[cert.status] ?? cert.status,
            isActive: cert.status === CertificateStatus.ACTIVE,
            deviceImage: deviceData.deviceImage,
        });

        return { pdfBuffer, certificate: cert };
    }

    @CreateRequestContext()
    async setPdfDocumentId(certId: string, documentId: string): Promise<Certificate> {
        const cert = await this.em.findOne(Certificate, { id: certId });
        if (!cert) throw AppErrors.dbEntityNotFound({ key: msg.certificate.notFound });
        cert.pdfDocumentId = documentId;
        await this.em.flush();
        return cert;
    }
}

const INTEGRITY_REASON_MESSAGES: Record<IntegrityFailReason, string> = {
    revoked: 'Certificate is revoked',
    expired: 'Certificate has expired',
    not_paid: 'Certificate is not paid',
    signature_invalid: 'Certificate signature is invalid',
    payment_not_found: 'Certificate payment not verified',
};

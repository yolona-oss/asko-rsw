import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { CertificateStatus } from '@asko/shared';
import { Certificate } from 'modules/certificate/entities/certificate.entity';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';
import { RepairRequestService } from 'modules/repair-request/services/repair-request.service';

const REMINDER_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CertificateExpiryService {
    private readonly logger = new Logger(CertificateExpiryService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly events: RepairEventService,
        @Inject(forwardRef(() => RepairRequestService))
        private readonly repairRequestService: RepairRequestService,
    ) {}

    /**
     * Daily sweep at 03:00 UTC.
     *  1. Warning sweep — ACTIVE certs expiring within REMINDER_WINDOW_DAYS that
     *     haven't been reminded yet (and user hasn't dismissed). Emits
     *     certificate.expiring_soon and flips expiryReminderSent so we don't nag.
     *  2. Expiry sweep — ACTIVE certs past expiresAt. Flips status to EXPIRED and
     *     emits certificate.expired. Signatures stay intact (historical integrity).
     */
    @Cron('0 3 * * *')
    @CreateRequestContext()
    async runDailySweep(): Promise<void> {
        await this.sendExpiryWarnings();
        await this.markExpiredCertificates();
    }

    private async sendExpiryWarnings(): Promise<void> {
        const now = new Date();
        const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * DAY_MS);

        const candidates = await this.em.find(Certificate, {
            status: CertificateStatus.ACTIVE,
            expiresAt: { $gte: now, $lte: windowEnd },
            expiryReminderSent: false,
            expiryReminderDismissed: false,
        });

        if (candidates.length === 0) return;
        this.logger.log(`Sending expiry warnings for ${candidates.length} certificates`);

        for (const cert of candidates) {
            const userDeviceId = typeof cert.userDevice === 'object'
                ? cert.userDevice.id
                : String(cert.userDevice);
            const daysUntilExpiry = Math.max(
                0,
                Math.ceil((cert.expiresAt.getTime() - now.getTime()) / DAY_MS),
            );

            try {
                await this.events.emitCertificateEvent({
                    type: RepairEventType.CERTIFICATE_EXPIRING_SOON,
                    certificateId: cert.id,
                    certificateNumber: cert.certificateNumber,
                    userId: cert.userId,
                    userDeviceId,
                    expiresAt: cert.expiresAt.toISOString(),
                    daysUntilExpiry,
                    timestamp: new Date(),
                });
                cert.expiryReminderSent = true;
            } catch (err) {
                this.logger.error(`Failed to emit expiring_soon for cert ${cert.id}: ${err}`);
            }
        }

        await this.em.flush();
    }

    private async markExpiredCertificates(): Promise<void> {
        const now = new Date();

        const expired = await this.em.find(Certificate, {
            status: CertificateStatus.ACTIVE,
            expiresAt: { $lt: now },
        });

        if (expired.length === 0) return;
        this.logger.log(`Marking ${expired.length} certificates as EXPIRED`);

        for (const cert of expired) {
            const userDeviceId = typeof cert.userDevice === 'object'
                ? cert.userDevice.id
                : String(cert.userDevice);

            cert.status = CertificateStatus.EXPIRED;

            try {
                await this.events.emitCertificateEvent({
                    type: RepairEventType.CERTIFICATE_EXPIRED,
                    certificateId: cert.id,
                    certificateNumber: cert.certificateNumber,
                    userId: cert.userId,
                    userDeviceId,
                    expiresAt: cert.expiresAt.toISOString(),
                    daysUntilExpiry: 0,
                    timestamp: new Date(),
                });
            } catch (err) {
                this.logger.error(`Failed to emit expired event for cert ${cert.id}: ${err}`);
            }

            try {
                await this.repairRequestService.handleCertificateInvalidated(cert.id);
            } catch (err) {
                this.logger.error(`Failed to invalidate open requests for cert ${cert.id}: ${err}`);
            }
        }

        await this.em.flush();
    }
}

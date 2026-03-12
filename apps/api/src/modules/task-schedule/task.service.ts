import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { Session } from '@entities/auth/session.entity';
import { Certificate } from '@entities/certificate.entity';
import { CertificateStatus } from '@asko/shared';
import { CursorService } from 'modules/cursor/cursor.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly cursorService: CursorService
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredSessions() {
        const now = new Date();
        const deleted = await this.em.nativeDelete(Session, {
            expiresAt: { $lt: now },
        });

        if (deleted > 0) {
            this.logger.log(`Cleaned up ${deleted} expired session(s)`);
        }
    }

    /** Expire certificates past their expiration date */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async expireCertificates() {
        const now = new Date();
        const expired = await this.em.nativeUpdate(
            Certificate,
            { expiresAt: { $lt: now }, status: CertificateStatus.ACTIVE },
            { status: CertificateStatus.EXPIRED }
        );

        if (expired > 0) {
            this.logger.log(`Expired ${expired} certificate(s)`);
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleStaleCursors() {
        this.logger.debug('Cleaning up stale cursors...');
        await this.cursorService.cleanupStaleCursors();
    }
}

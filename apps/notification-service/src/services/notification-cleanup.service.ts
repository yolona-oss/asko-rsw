import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { NOTIFICATION_TYPE_TO_GROUP, NotificationGroup } from '@asko/shared';
import { AppConfig } from '../app.config';

const CLEANUP_CRON = process.env.NOTIFICATION_CLEANUP_CRON ?? '0 3 * * *';

@Injectable()
export class NotificationCleanupService {
    private readonly logger = new Logger(NotificationCleanupService.name);

    private readonly paymentTypes: string[];

    constructor(
        private readonly em: EntityManager,
        private readonly config: AppConfig,
    ) {
        this.paymentTypes = Object.entries(NOTIFICATION_TYPE_TO_GROUP)
            .filter(([, g]) => g === NotificationGroup.PAYMENT)
            .map(([type]) => type);
    }

    @Cron(CLEANUP_CRON)
    @CreateRequestContext()
    async cleanup(): Promise<void> {
        const key = this.config.cleanup.advisoryLockKey;
        const conn = this.em.getConnection();

        const lockResult = await conn.execute<{ locked: boolean }[]>(
            `SELECT pg_try_advisory_lock(${key}) AS locked`,
        );
        const locked = Array.isArray(lockResult) && lockResult[0]?.locked === true;
        if (!locked) {
            this.logger.debug('Cleanup skipped: advisory lock held by another replica');
            return;
        }

        const startedAt = Date.now();
        try {
            await this.deleteStaleNotifications();
        } finally {
            await conn.execute(`SELECT pg_advisory_unlock(${key})`);
            const elapsed = Date.now() - startedAt;
            this.logger.log(`Notification cleanup completed in ${elapsed}ms`);
        }
    }

    private async deleteStaleNotifications(): Promise<void> {
        const conn = this.em.getConnection();
        const now = Date.now();

        const readCutoff = new Date(now - this.config.cleanup.readRetentionMs);
        const readDeleted = await this.deleteBatched(
            conn,
            `"is_read" = true AND "read_at" < $1`,
            [readCutoff],
        );
        if (readDeleted > 0) {
            this.logger.log(`Deleted ${readDeleted} stale read notifications`);
        }

        const criticalCutoff = new Date(now - this.config.cleanup.unreadCriticalRetentionMs);
        const critDeleted = await this.deleteBatched(
            conn,
            `"is_read" = false AND "created_at" < $1 AND ("urgency" = 'critical' OR "type" = ANY($2))`,
            [criticalCutoff, this.paymentTypes],
        );
        if (critDeleted > 0) {
            this.logger.log(`Deleted ${critDeleted} stale unread critical/payment notifications`);
        }

        const commonCutoff = new Date(now - this.config.cleanup.unreadCommonRetentionMs);
        const commonDeleted = await this.deleteBatched(
            conn,
            `"is_read" = false AND "created_at" < $1 AND "urgency" != 'critical' AND NOT ("type" = ANY($2))`,
            [commonCutoff, this.paymentTypes],
        );
        if (commonDeleted > 0) {
            this.logger.log(`Deleted ${commonDeleted} stale unread common notifications`);
        }
    }

    private async deleteBatched(
        conn: ReturnType<EntityManager['getConnection']>,
        whereClause: string,
        params: unknown[],
        batchSize = 5000,
    ): Promise<number> {
        let totalDeleted = 0;
        for (;;) {
            const result = await conn.execute(
                `DELETE FROM "notification" WHERE "id" IN (SELECT "id" FROM "notification" WHERE ${whereClause} LIMIT ${batchSize})`,
                params,
            );
            const deleted = (result as any)?.rowCount ?? 0;
            totalDeleted += deleted;
            if (deleted < batchSize) break;
        }
        return totalDeleted;
    }
}

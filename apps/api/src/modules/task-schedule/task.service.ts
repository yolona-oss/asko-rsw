import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { Session } from '@entities/auth/session.entity';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private readonly em: EntityManager) {}

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
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { CursorService } from 'modules/cursor/cursor.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly cursorService: CursorService
    ) { }

    // TODO move to user-service
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredSessions() {
        // const now = new Date();
        // const deleted = await this.em.nativeDelete(Session, {
        //     expiresAt: { $lt: now },
        // });

        // if (deleted > 0) {
        //     this.logger.log(`Cleaned up ${deleted} expired session(s)`);
        // }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleStaleCursors() {
        // this.logger.debug('Cleaning up stale cursors...');
        // await this.cursorService.cleanupStaleCursors();
    }
}

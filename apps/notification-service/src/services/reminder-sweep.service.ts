import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { AppConfig } from '../app.config';
import { ReminderService } from './reminder.service';

const SWEEP_CRON = process.env.REMINDER_SWEEP_CRON ?? CronExpression.EVERY_MINUTE;

@Injectable()
export class ReminderSweepService {
    private readonly logger = new Logger(ReminderSweepService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly reminderService: ReminderService,
        private readonly config: AppConfig,
    ) {}

    @Cron(SWEEP_CRON)
    @CreateRequestContext()
    async sweep(): Promise<void> {
        const key = this.config.reminders.advisoryLockKey;
        const conn = this.em.getConnection();

        const lockResult = await conn.execute<{ locked: boolean }[]>(
            `SELECT pg_try_advisory_lock(${key}) AS locked`,
        );
        const locked = Array.isArray(lockResult) && lockResult[0]?.locked === true;
        if (!locked) {
            this.logger.debug('Sweep skipped: advisory lock held by another replica');
            return;
        }

        const startedAt = Date.now();
        try {
            await this.reminderService.fireDueReminders();
        } finally {
            await conn.execute(`SELECT pg_advisory_unlock(${key})`);
            const elapsed = Date.now() - startedAt;
            if (elapsed > 5000) {
                this.logger.warn(`Sweep held advisory lock for ${elapsed}ms`);
            }
        }
    }
}

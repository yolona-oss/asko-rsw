import { Injectable, Logger } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import {
    ReminderJobEntity,
    ReminderKind,
} from 'entities/reminder-job.entity';
import { NotificationUrgency } from '@asko/shared';
import { AppConfig } from '../app.config';
import { NotificationService } from './notification.service';

export interface ScheduleReminderParams {
    kind: ReminderKind;
    targetType: string;
    targetId: string;
    recipientUserIds: string[];
    notificationType: string;
    title: string;
    body: string;
    metadata?: Record<string, any>;
    intervalMs: number;
    maxFires: number;
    firstFireAt?: Date;
}

@Injectable()
export class ReminderService {
    private readonly logger = new Logger(ReminderService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly notificationService: NotificationService,
        private readonly config: AppConfig,
    ) {}

    @CreateRequestContext()
    async scheduleReminder(params: ScheduleReminderParams): Promise<ReminderJobEntity> {
        const existing = await this.em.findOne(ReminderJobEntity, {
            kind: params.kind,
            targetType: params.targetType,
            targetId: params.targetId,
            status: 'active',
        });
        if (existing) {
            this.logger.debug(
                `Reminder already active for ${params.kind}/${params.targetType}/${params.targetId}, returning existing ${existing.id}`,
            );
            return existing;
        }

        const recipients = Array.from(new Set(params.recipientUserIds.filter(Boolean)));
        if (recipients.length === 0) {
            throw new Error(
                `Cannot schedule reminder ${params.kind} for ${params.targetType}/${params.targetId}: no recipients`,
            );
        }

        const job = this.em.create(ReminderJobEntity, {
            kind: params.kind,
            targetType: params.targetType,
            targetId: params.targetId,
            recipientUserIds: recipients,
            notificationType: params.notificationType,
            title: params.title,
            body: params.body,
            metadata: params.metadata,
            intervalMs: params.intervalMs,
            maxFires: params.maxFires,
            nextFireAt: params.firstFireAt ?? new Date(Date.now() + params.intervalMs),
        });
        await this.em.persistAndFlush(job);
        this.logger.log(
            `Scheduled reminder ${job.id} kind=${job.kind} target=${job.targetType}/${job.targetId} nextFireAt=${job.nextFireAt.toISOString()}`,
        );
        return job;
    }

    @CreateRequestContext()
    async cancelReminder(
        targetType: string,
        targetId: string,
        reason: string,
        kinds?: ReminderKind[],
    ): Promise<number> {
        const where: Record<string, any> = {
            targetType,
            targetId,
            status: 'active',
        };
        if (kinds && kinds.length > 0) where.kind = { $in: kinds };

        const jobs = await this.em.find(ReminderJobEntity, where);
        if (jobs.length === 0) return 0;

        for (const job of jobs) {
            job.status = 'cancelled';
            job.cancelReason = reason;
        }
        await this.em.flush();
        this.logger.log(
            `Cancelled ${jobs.length} reminder(s) for ${targetType}/${targetId} reason=${reason}`,
        );
        return jobs.length;
    }

    @CreateRequestContext()
    async fireDueReminders(): Promise<void> {
        const now = new Date();
        const due = await this.em.find(
            ReminderJobEntity,
            { status: 'active', nextFireAt: { $lte: now } },
            {
                limit: this.config.reminders.sweepBatchSize,
                orderBy: { nextFireAt: 'ASC' },
            },
        );

        if (due.length === 0) return;
        this.logger.log(`Sweep: ${due.length} due reminder(s)`);

        for (const job of due) {
            try {
                await this.fireSingleJob(job);
            } catch (e) {
                this.logger.error(
                    `Reminder job ${job.id} failed: ${(e as Error).message}`,
                );
            }
        }

        await this.em.flush();
    }

    private async fireSingleJob(job: ReminderJobEntity): Promise<void> {
        let anyFired = false;
        for (const userId of job.recipientUserIds) {
            const hasUnread = await this.notificationService.hasUnreadForTarget(
                userId,
                job.targetType,
                job.targetId,
            );
            if (hasUnread) {
                this.logger.debug(
                    `Skipped user=${userId} job=${job.id}: unread prior exists`,
                );
                continue;
            }
            await this.notificationService.createNotification({
                userId,
                type: job.notificationType,
                title: job.title,
                body: job.body,
                targetType: job.targetType,
                targetId: job.targetId,
                metadata: { ...(job.metadata ?? {}), reminderAttempt: job.fireCount + 1 },
                urgency: NotificationUrgency.HIGH,
            });
            anyFired = true;
        }

        if (anyFired) job.fireCount += 1;
        job.nextFireAt = new Date(Date.now() + job.intervalMs);
        if (job.fireCount >= job.maxFires) {
            job.status = 'exhausted';
            this.logger.log(`Reminder ${job.id} exhausted after ${job.fireCount} fires`);
        }
    }
}

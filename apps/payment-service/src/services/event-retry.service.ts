import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { lastValueFrom } from 'rxjs';
import { FailedEventEntity } from 'entities/failed-event.entity';

const MAX_RETRIES = 5;

@Injectable()
export class EventRetryService {
    private readonly logger = new Logger(EventRetryService.name);

    constructor(
        private readonly em: EntityManager,
        @Inject('EVENTS_SERVICE') private readonly notificationClient: ClientProxy,
        @Inject('REPAIR_EVENTS_SERVICE') private readonly repairClient: ClientProxy,
    ) {}

    @Cron('*/2 * * * *')
    @CreateRequestContext()
    async retryFailedEvents(): Promise<void> {
        const now = new Date();
        const failedEvents = await this.em.find(
            FailedEventEntity,
            { nextRetryAt: { $lt: now }, retryCount: { $lt: MAX_RETRIES } },
            { limit: 50, orderBy: { nextRetryAt: 'ASC' } },
        );

        if (failedEvents.length === 0) return;

        this.logger.log(`Retrying ${failedEvents.length} failed events`);

        for (const failedEvent of failedEvents) {
            const client = failedEvent.targetQueue === 'notification'
                ? this.notificationClient
                : this.repairClient;

            try {
                await lastValueFrom(client.emit(failedEvent.eventType, failedEvent.payload));
                this.em.remove(failedEvent);
                this.logger.log(`Successfully retried event ${failedEvent.id} (${failedEvent.eventType})`);
            } catch (e) {
                failedEvent.retryCount += 1;
                failedEvent.lastError = String(e);
                failedEvent.nextRetryAt = new Date(
                    Date.now() + Math.pow(2, failedEvent.retryCount) * 60 * 1000,
                );

                if (failedEvent.retryCount >= MAX_RETRIES) {
                    this.logger.error(`Event ${failedEvent.id} (${failedEvent.eventType}) exceeded max retries`);
                }
            }
        }

        await this.em.flush();
    }
}

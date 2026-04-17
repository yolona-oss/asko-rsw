import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EntityManager } from '@mikro-orm/postgresql';
import { Role } from '@asko/shared';
import { RepairerService } from 'modules/repairer/services/repairer.service';
import { DealerService } from 'modules/dealer/services/dealer.service';
import { UserStatusHistory } from 'modules/repairer/entities/user-status-history.entity';

interface UserRegisteredPayload {
    userId: string;
    roles: Role[];
}

interface UserStatusChangedPayload {
    userId: string;
    isActive: boolean;
    changedBy?: string | null;
    timestamp: string;
}

@Controller()
export class UserEventConsumer {
    private readonly logger = new Logger(UserEventConsumer.name);

    constructor(
        private readonly repairerService: RepairerService,
        private readonly dealerService: DealerService,
        private readonly em: EntityManager,
    ) {}

    @EventPattern('user.registered')
    async handleUserRegistered(
        @Payload() data: UserRegisteredPayload,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const roles = data.roles ?? [];

            if (roles.includes(Role.REPAIRER)) {
                try {
                    await this.repairerService.create(data.userId, '', []);
                    this.logger.log(`Repairer profile created for user ${data.userId}`);
                } catch (e: any) {
                    if (/already exists/i.test(String(e?.message))) {
                        this.logger.log(`Repairer profile already exists for user ${data.userId}`);
                    } else {
                        throw e;
                    }
                }
            }

            if (roles.includes(Role.DEALER)) {
                try {
                    await this.dealerService.createProfile({ userId: data.userId });
                    this.logger.log(`Dealer profile created for user ${data.userId}`);
                } catch (e: any) {
                    if (/already exists/i.test(String(e?.message))) {
                        this.logger.log(`Dealer profile already exists for user ${data.userId}`);
                    } else {
                        throw e;
                    }
                }
            }

            channel.ack(msg);
        } catch (e) {
            this.logger.error(`user.registered error: ${e}`);
            channel.nack(msg, false, false);
        }
    }

    @EventPattern('user.status_changed')
    async handleUserStatusChanged(
        @Payload() data: UserStatusChangedPayload,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const fork = this.em.fork();
            const entry = new UserStatusHistory();
            entry.userId = data.userId;
            entry.isActive = data.isActive;
            entry.changedBy = data.changedBy ?? null;
            entry.changedAt = new Date(data.timestamp);
            await fork.persistAndFlush(entry);
            this.logger.log(`User status history recorded: ${data.userId} isActive=${data.isActive}`);
            channel.ack(msg);
        } catch (e) {
            this.logger.error(`user.status_changed error: ${e}`);
            channel.nack(msg, false, false);
        }
    }
}

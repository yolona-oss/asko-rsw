import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Role } from '@asko/shared';
import { RepairerService } from 'services/repairer.service';
import { DealerService } from 'services/dealer.service';

interface UserRegisteredPayload {
    userId: string;
    roles: Role[];
}

@Controller()
export class UserEventConsumer {
    private readonly logger = new Logger(UserEventConsumer.name);

    constructor(
        private readonly repairerService: RepairerService,
        private readonly dealerService: DealerService,
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
}

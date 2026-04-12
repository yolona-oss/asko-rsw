import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { AudienceProjectionService, AudienceKey } from 'services/audience-projection.service';

@Controller()
export class UserLifecycleEventConsumer {
    private readonly logger = new Logger(UserLifecycleEventConsumer.name);

    constructor(private readonly audience: AudienceProjectionService) {}

    @EventPattern('user.created')
    async handleUserCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const roles: string[] = Array.isArray(data?.roles)
                ? data.roles
                : data?.role
                    ? [data.role]
                    : [];
            if (data?.userId && roles.length > 0) {
                const keys = roles.map((r) => AudienceKey.role(r));
                const created = await this.audience.addMany(data.userId, keys, 'user.created');
                this.logger.log(
                    `user.created user=${data.userId} added ${created}/${keys.length} role memberships`,
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[UserLifecycleEventConsumer] user.created error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('user.role_added')
    async handleRoleAdded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data?.userId && data?.role) {
                await this.audience.add(data.userId, AudienceKey.role(data.role), 'user.role_added');
                this.logger.log(
                    `user.role_added user=${data.userId} role=${data.role}`,
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[UserLifecycleEventConsumer] user.role_added error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('user.role_removed')
    async handleRoleRemoved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data?.userId && data?.role) {
                const removed = await this.audience.remove(data.userId, AudienceKey.role(data.role));
                this.logger.log(
                    `user.role_removed user=${data.userId} role=${data.role} removed=${removed}`,
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[UserLifecycleEventConsumer] user.role_removed error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('user.deleted')
    async handleUserDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data?.userId) {
                const removed = await this.audience.removeAllForUser(data.userId);
                this.logger.log(
                    `user.deleted user=${data.userId} removed ${removed} memberships`,
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[UserLifecycleEventConsumer] user.deleted error:', e);
            channel.ack(msg);
        }
    }
}

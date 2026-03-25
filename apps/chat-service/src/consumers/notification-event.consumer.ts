import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class NotificationEventConsumer {
    @EventPattern('notification.created')
    async handleNotificationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            console.log(
                `[NotificationEventConsumer] notification.created: type=${data.type} userId=${data.userId} targetId=${data.targetId}`,
            );

            // Future: create system messages in conversations, update chat UI, etc.

            channel.ack(msg);
        } catch (e) {
            console.error('[NotificationEventConsumer] notification.created error:', e);
            channel.ack(msg);
        }
    }
}

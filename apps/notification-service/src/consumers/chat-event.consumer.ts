import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { NotificationType, NotificationTargetType } from '@asko/shared';

@Controller()
export class ChatEventConsumer {
    constructor(private readonly notificationService: NotificationService) {}

    @EventPattern('chat.message')
    async handleChatMessage(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const title = data.conversationName
                ? `Новое сообщение в "${data.conversationName}"`
                : 'Новое сообщение';

            const body = data.messageText
                ? data.messageText.substring(0, 200)
                : this.getMessageTypeLabel(data.messageType);

            // Create a notification for each recipient
            for (const recipientId of data.recipientIds ?? []) {
                await this.notificationService.createNotification(
                    recipientId,
                    NotificationType.CHAT_MESSAGE,
                    title,
                    body,
                    NotificationTargetType.CONVERSATION,
                    data.conversationId,
                    {
                        messageId: data.messageId,
                        senderId: data.senderId,
                        conversationId: data.conversationId,
                        messageType: data.messageType,
                    },
                );
            }

            channel.ack(msg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.message error:', e);
            channel.ack(msg);
        }
    }

    private getMessageTypeLabel(type: string): string {
        switch (type) {
            case 'image': return 'Изображение';
            case 'video': return 'Видео';
            default: return 'Сообщение';
        }
    }
}

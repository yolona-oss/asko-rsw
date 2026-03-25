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

    @EventPattern('chat.conversation_created')
    async handleConversationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const title = data.conversationName
                ? `Новый чат "${data.conversationName}"`
                : 'Новый чат';

            const body = data.conversationType === 'group'
                ? 'Вас добавили в групповой чат'
                : 'Начат новый диалог';

            for (const recipientId of data.recipientIds ?? []) {
                await this.notificationService.createNotification(
                    recipientId,
                    NotificationType.CHAT_CONVERSATION_CREATED,
                    title,
                    body,
                    NotificationTargetType.CONVERSATION,
                    data.conversationId,
                    {
                        conversationId: data.conversationId,
                        conversationType: data.conversationType,
                        creatorId: data.creatorId,
                    },
                );
            }

            channel.ack(msg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.conversation_created error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('chat.participant_added')
    async handleParticipantAdded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const title = data.conversationName
                ? `Добавлены в "${data.conversationName}"`
                : 'Добавлены в чат';

            await this.notificationService.createNotification(
                data.targetUserId,
                NotificationType.CHAT_PARTICIPANT_ADDED,
                title,
                'Вас добавили в чат',
                NotificationTargetType.CONVERSATION,
                data.conversationId,
                {
                    conversationId: data.conversationId,
                    actorId: data.actorId,
                },
            );

            channel.ack(msg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.participant_added error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('chat.participant_removed')
    async handleParticipantRemoved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const title = data.conversationName
                ? `Удалены из "${data.conversationName}"`
                : 'Удалены из чата';

            await this.notificationService.createNotification(
                data.targetUserId,
                NotificationType.CHAT_PARTICIPANT_REMOVED,
                title,
                'Вас удалили из чата',
                NotificationTargetType.CONVERSATION,
                data.conversationId,
                {
                    conversationId: data.conversationId,
                    actorId: data.actorId,
                },
            );

            channel.ack(msg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.participant_removed error:', e);
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

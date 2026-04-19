import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { NotificationType, NotificationTargetType, NotificationUrgency, t, msg } from '@asko/shared';

@Controller()
export class ChatEventConsumer {
    constructor(private readonly notificationService: NotificationService) {}

    @EventPattern('chat.message')
    async handleChatMessage(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const title = data.conversationName
                ? t(msg.notify.title.chatMessageNamed, undefined, { name: data.conversationName })
                : t(msg.notify.title.chatMessage);

            const body = data.messageText
                ? data.messageText.substring(0, 200)
                : this.getMessageTypeLabel(data.messageType);

            for (const recipientId of data.recipientIds ?? []) {
                await this.notificationService.createNotification({
                    userId: recipientId,
                    type: NotificationType.CHAT_MESSAGE,
                    title,
                    body,
                    targetType: NotificationTargetType.CONVERSATION,
                    targetId: data.conversationId,
                    metadata: {
                        messageId: data.messageId,
                        senderId: data.senderId,
                        conversationId: data.conversationId,
                        messageType: data.messageType,
                    },
                });
            }

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.message error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('chat.conversation_created')
    async handleConversationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const title = data.conversationName
                ? t(msg.notify.title.chatConversationCreatedNamed, undefined, { name: data.conversationName })
                : t(msg.notify.title.chatConversationCreated);

            const body = data.conversationType === 'group'
                ? t(msg.notify.body.chatGroupCreated)
                : t(msg.notify.body.chatDirectCreated);

            for (const recipientId of data.recipientIds ?? []) {
                await this.notificationService.createNotification({
                    userId: recipientId,
                    type: NotificationType.CHAT_CONVERSATION_CREATED,
                    title,
                    body,
                    targetType: NotificationTargetType.CONVERSATION,
                    targetId: data.conversationId,
                    metadata: {
                        conversationId: data.conversationId,
                        conversationType: data.conversationType,
                        creatorId: data.creatorId,
                    },
                });
            }

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.conversation_created error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('chat.participant_added')
    async handleParticipantAdded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const title = data.conversationName
                ? t(msg.notify.title.chatParticipantAddedNamed, undefined, { name: data.conversationName })
                : t(msg.notify.title.chatParticipantAdded);

            await this.notificationService.createNotification({
                userId: data.targetUserId,
                type: NotificationType.CHAT_PARTICIPANT_ADDED,
                title,
                body: t(msg.notify.body.chatParticipantAdded),
                targetType: NotificationTargetType.CONVERSATION,
                targetId: data.conversationId,
                metadata: {
                    conversationId: data.conversationId,
                    actorId: data.actorId,
                },
                urgency: NotificationUrgency.LOW,
            });

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.participant_added error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('chat.participant_removed')
    async handleParticipantRemoved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const title = data.conversationName
                ? t(msg.notify.title.chatParticipantRemovedNamed, undefined, { name: data.conversationName })
                : t(msg.notify.title.chatParticipantRemoved);

            await this.notificationService.createNotification({
                userId: data.targetUserId,
                type: NotificationType.CHAT_PARTICIPANT_REMOVED,
                title,
                body: t(msg.notify.body.chatParticipantRemoved),
                targetType: NotificationTargetType.CONVERSATION,
                targetId: data.conversationId,
                metadata: {
                    conversationId: data.conversationId,
                    actorId: data.actorId,
                },
                urgency: NotificationUrgency.LOW,
            });

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ChatEventConsumer] chat.participant_removed error:', e);
            channel.ack(rmqMsg);
        }
    }

    private getMessageTypeLabel(type: string): string {
        switch (type) {
            case 'image': return t(msg.notify.body.chatMessageImage);
            case 'video': return t(msg.notify.body.chatMessageVideo);
            default: return t(msg.notify.body.chatMessageDefault);
        }
    }
}

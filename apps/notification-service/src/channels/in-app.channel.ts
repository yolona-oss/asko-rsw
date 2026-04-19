import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@asko/shared';
import { NotificationPushService } from 'services/notification-push.service';
import { NotificationEventPublisher } from 'services/notification-event.publisher';
import type { NotificationChannelDelivery, NotificationPayload } from './notification-channel.interface';

@Injectable()
export class InAppChannel implements NotificationChannelDelivery {
    readonly channelName = NotificationChannel.IN_APP;

    constructor(
        private readonly pushService: NotificationPushService,
        private readonly eventPublisher: NotificationEventPublisher,
    ) {}

    async deliver(userId: string, notification: NotificationPayload): Promise<void> {
        await this.pushService.pushToUser(userId, notification);
        await this.eventPublisher.publishCreated(notification);
    }
}

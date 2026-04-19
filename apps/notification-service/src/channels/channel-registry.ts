import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@asko/shared';
import { InAppChannel } from './in-app.channel';
import { WebPushChannel } from './web-push.channel';
import { EmailChannel } from './email.channel';
import type { NotificationChannelDelivery } from './notification-channel.interface';

@Injectable()
export class ChannelRegistry {
    private readonly channels = new Map<NotificationChannel, NotificationChannelDelivery>();
    private readonly allChannels: NotificationChannelDelivery[];

    constructor(
        inApp: InAppChannel,
        webPush: WebPushChannel,
        email: EmailChannel,
    ) {
        this.channels.set(NotificationChannel.IN_APP, inApp);
        this.channels.set(NotificationChannel.PUSH, webPush);
        this.channels.set(NotificationChannel.EMAIL, email);
        this.allChannels = Array.from(this.channels.values());
    }

    get(name: NotificationChannel): NotificationChannelDelivery | undefined {
        return this.channels.get(name);
    }

    all(): readonly NotificationChannelDelivery[] {
        return this.allChannels;
    }
}

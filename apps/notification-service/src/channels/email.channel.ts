import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationChannel } from '@asko/shared';
import { AppConfig } from '../app.config';
import { EMAIL_QUEUE_NAME } from 'common/email-job.interface';
import type { EmailJobData } from 'common/email-job.interface';
import type { NotificationChannelDelivery, NotificationPayload, ChannelContext } from './notification-channel.interface';

@Injectable()
export class EmailChannel implements NotificationChannelDelivery {
    readonly channelName = NotificationChannel.EMAIL;

    constructor(
        @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue<EmailJobData>,
        private readonly config: AppConfig,
    ) {}

    async deliver(userId: string, notification: NotificationPayload, context: ChannelContext): Promise<void> {
        if (!context.userEmail || !context.emailVerified) return;

        await this.emailQueue.add('send', {
            to: context.userEmail,
            from: this.config.email.from,
            subject: notification.title,
            text: notification.body,
            html: this.renderHtml(notification),
            metadata: {
                type: notification.type,
                userId,
                priority: 5,
            },
        }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
        });
    }

    private renderHtml(n: NotificationPayload): string {
        return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2 style="margin:0 0 12px">${this.escapeHtml(n.title)}</h2><p style="margin:0;color:#333">${this.escapeHtml(n.body)}</p></div>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

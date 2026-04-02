import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE_NAME, type EmailJobData } from 'common/email-job.interface';

@Controller()
export class EmailEventConsumer {
    constructor(
        @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue<EmailJobData>,
    ) {}

    @EventPattern('email.send')
    async handleEmailSend(
        @Payload() data: EmailJobData,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const priority = data.metadata?.priority ?? 5;

            await this.emailQueue.add('send', data, {
                attempts: 5,
                backoff: { type: 'exponential', delay: 3000 },
                removeOnComplete: { count: 1000 },
                removeOnFail: { count: 5000 },
                priority,
            });

            console.log(`[EmailEventConsumer] Enqueued email to=${data.to} type=${data.metadata?.type ?? 'unknown'}`);
            channel.ack(msg);
        } catch (e) {
            console.error('[EmailEventConsumer] Failed to enqueue email:', e);
            channel.ack(msg);
        }
    }
}

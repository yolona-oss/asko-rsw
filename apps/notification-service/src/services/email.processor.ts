import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailTransportService } from './email-transport.service';
import { EMAIL_QUEUE_NAME, type EmailJobData } from 'common/email-job.interface';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
    constructor(private readonly transport: EmailTransportService) {
        super();
    }

    async process(job: Job<EmailJobData>): Promise<void> {
        const { to, from, subject, text, html, metadata } = job.data;

        console.log(
            `[EmailProcessor] job=${job.id} to=${to} type=${metadata?.type ?? 'unknown'} attempt=${job.attemptsMade + 1}`,
        );

        await this.transport.sendMail({ to, from, subject, text, html });

        console.log(`[EmailProcessor] job=${job.id} delivered`);
    }
}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfig } from '../app.config';
import { EMAIL_QUEUE_NAME } from 'common/email-job.interface';
import { EmailTransportService } from 'services/email-transport.service';
import { EmailProcessor } from 'services/email.processor';

@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({
                connection: { url: config.redisUrl },
            }),
        }),
        BullModule.registerQueue({ name: EMAIL_QUEUE_NAME }),
    ],
    providers: [EmailTransportService, EmailProcessor],
    exports: [BullModule],
})
export class EmailQueueModule {}

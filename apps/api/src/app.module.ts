import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@asko/observability';

import { AppConfigModule } from './app.config';

import { JwtGuard } from './common/guards/jwt.guard';
import { UserModule } from 'modules/user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';
import { FileAccessModule } from 'modules/file-access/file-access.module';
import { AddressModule } from 'modules/address/address.module';
import { WScheduleModule } from 'modules/wschedule/wschedule.module';
import { TaskScheduleModule } from 'modules/task-schedule/task.module';
import { ArticlesModule } from 'modules/articles/articles.module';
import { DeviceModule } from 'modules/device/device.module';
import { CertificateModule } from 'modules/certificate/certificate.module';
import { RepairModule } from 'modules/repair/repair.module';
import { RepairerModule } from 'modules/repairer/repairer.module';
import { DealerModule } from 'modules/dealer/dealer.module';
import { ReviewModule } from 'modules/review/review.module';
import { NotificationModule } from 'modules/notification/notification.module';
import { ChatModule } from 'modules/chat/chat.module';

import { HealthModule } from 'modules/health/health.module';
import { PaymentModule } from 'modules/payment/payment.module';

@Module({
    imports: [
        AppConfigModule,
        EventEmitterModule.forRoot(),
        MetricsModule.register({ serviceName: 'api' }),
        JwtModule,

        TaskScheduleModule,
        WScheduleModule,
        AddressModule,
        FileUploadModule,
        FileAccessModule,
        UserModule,
        ArticlesModule,
        DeviceModule,
        CertificateModule,
        RepairModule,
        RepairerModule,
        DealerModule,
        ReviewModule,
        NotificationModule,
        ChatModule,

        HealthModule,
        PaymentModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
    ],
})
export class AppModule { }

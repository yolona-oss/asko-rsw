import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@asko/observability';
import { join } from 'path';

import { AppConfig, AppConfigModule } from './app.config';

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
import { OAuthModule } from 'modules/auth/oauth.module';

@Module({
    imports: [
        AppConfigModule,
        EventEmitterModule.forRoot(),
        MetricsModule.register({ serviceName: 'api' }),
        JwtModule,

        // Legacy static file serving for old URLs in DB (/images/*, /videos/*)
        ServeStaticModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => [
                {
                    rootPath: join(process.cwd(), config.staticPath),
                    serveRoot: '/images',
                    serveStaticOptions: { cacheControl: true, extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'webp'] },
                },
                {
                    rootPath: join(process.cwd(), config.staticPath, 'videos'),
                    serveRoot: '/videos',
                    serveStaticOptions: { cacheControl: true, extensions: ['mp4', 'webm', 'mov'] },
                },
            ],
        }),

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
        OAuthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
    ],
})
export class AppModule { }

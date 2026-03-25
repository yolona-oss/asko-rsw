import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmMiddleware } from '@mikro-orm/nestjs';

import { AppConfig, AppConfigModule } from './app.config';

import { JwtGuard } from './common/guards/jwt.guard';
import { UserModule } from 'modules/user/user.module';
import { DatabaseModule } from 'modules/database.module';
import { LoggerMiddleware } from 'common/middleware/logger.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';
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

import { join } from 'path';
import { CursorModule } from 'modules/cursor/cursor.module';
import { HealthModule } from 'modules/health/health.module';
import { PaymentModule } from 'modules/payment/payment.module';

console.debug("Images path: ", join(process.cwd(), 'images'))
console.debug("Videos path: ", join(process.cwd(), 'videos'))

@Module({
    imports: [
        AppConfigModule,
        EventEmitterModule.forRoot(),
        DatabaseModule,
        JwtModule,

        TaskScheduleModule,
        WScheduleModule,
        AddressModule,
        FileUploadModule,
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

        CursorModule,
        HealthModule,
        PaymentModule,

        ServeStaticModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => {
                return [
                    {
                        rootPath: join(process.cwd(), config.staticPath),
                        serveRoot: '/images',
                        serveStaticOptions: {
                            cacheControl: true,
                            extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico']
                        }
                    },
                    {
                        rootPath: join(process.cwd(), config.staticPath, 'videos'),
                        serveRoot: '/videos',
                        serveStaticOptions: {
                            cacheControl: true,
                            extensions: ['mp4', 'webm', 'mov']
                        }
                    },
                ]
            }
        }),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(MikroOrmMiddleware)
            .forRoutes('*')
            .apply(LoggerMiddleware)
            .forRoutes('*');
    }
}

import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

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
import { DeviceModule } from 'modules/device/device.module';
import { CertificateModule } from 'modules/certificate/certificate.module';
import { RepairModule } from 'modules/repair/repair.module';
import { RepairerModule } from 'modules/repairer/repairer.module';
import { DealerModule } from 'modules/dealer/dealer.module';
import { ReviewModule } from 'modules/review/review.module';
import { NotificationModule } from 'modules/notification/notification.module';

import { join } from 'path';
import { CursorModule } from 'modules/cursor/cursor.module';
console.log("Images path: ", join(process.cwd(), 'images'))

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
        DeviceModule,
        CertificateModule,
        RepairModule,
        RepairerModule,
        DealerModule,
        ReviewModule,
        NotificationModule,

        CursorModule,

        ServeStaticModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => {
                return [{
                    rootPath: join(process.cwd(), config.staticPath),
                    serveRoot: '/images',
                    serveStaticOptions: {
                        cacheControl: true,
                        extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico']
                    }
                }]
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
            .apply(LoggerMiddleware)
            .forRoutes('*');
    }
}

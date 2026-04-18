import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'database/database.module';
import { StorageModule } from 'storage/storage.module';
import { ImageModule } from 'image/image.module';
import { VideoModule } from 'video/video.module';
import { DocumentModule } from 'document/document.module';
import { UploadModule } from 'upload/upload.module';

@Module({
    imports: [
        AppConfigModule,
        ScheduleModule.forRoot(),
        MetricsModule.register({ serviceName: 'file-service' }),
        BullModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({
                connection: { url: config.redisUrl },
            }),
        }),
        DatabaseModule,
        StorageModule,
        ImageModule,
        VideoModule,
        DocumentModule,
        UploadModule,
    ],
})
export class AppModule {}

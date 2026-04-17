import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { StorageModule } from 'modules/storage.module';
import { ImageResizeQueueModule } from 'modules/image-resize-queue.module';
import { VideoCompressQueueModule } from 'modules/video-compress-queue.module';
import { Image } from 'entities/image.entity';
import { Video } from 'entities/video.entity';
import { FileAccess } from 'entities/file-access.entity';
import { Document } from 'entities/document.entity';
import { ImageService } from 'services/image.service';
import { VideoService } from 'services/video.service';
import { ImageCleanupService } from 'services/image-cleanup.service';
import { DocumentService } from 'services/document.service';
import { FileGrpcController } from 'controllers/file.grpc.controller';

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
        MikroOrmModule.forFeature([Image, Video, FileAccess, Document]),
        ImageResizeQueueModule,
        VideoCompressQueueModule,
    ],
    controllers: [FileGrpcController],
    providers: [
        ImageService,
        VideoService,
        ImageCleanupService,
        DocumentService,
    ],
})
export class AppModule {}

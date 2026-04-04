import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { ImageResizeQueueModule } from 'modules/image-resize-queue.module';
import { Image } from 'entities/image.entity';
import { Video } from 'entities/video.entity';
import { FileAccess } from 'entities/file-access.entity';
import { ImageService } from 'services/image.service';
import { VideoService } from 'services/video.service';
import { ImageCleanupService } from 'services/image-cleanup.service';
import { CloudinaryService } from 'services/cloudinary.service';
import { LocalStorageService } from 'services/local-storage.service';
import { STORAGE_PROVIDER } from 'storage/storage-provider.interface';
import { FileGrpcController } from 'controllers/file.grpc.controller';

@Module({
    imports: [
        AppConfigModule,
        ScheduleModule.forRoot(),
        MetricsModule.register({ serviceName: 'file-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([Image, Video, FileAccess]),
        ImageResizeQueueModule,
    ],
    controllers: [FileGrpcController],
    providers: [
        {
            provide: STORAGE_PROVIDER,
            useFactory: (config: AppConfig) => {
                if (config.fileStorageMode === 'local') {
                    return new LocalStorageService(config);
                }
                return new CloudinaryService();
            },
            inject: [AppConfig],
        },
        ImageService,
        VideoService,
        ImageCleanupService,
    ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { Image } from 'entities/image.entity';
import { Video } from 'entities/video.entity';
import { ImageService } from 'services/image.service';
import { VideoService } from 'services/video.service';
import { ImageProcessingService } from 'services/image-processing.service';
import { ImageResizeService } from 'services/image-resize.service';
import { CloudinaryService } from 'services/cloudinary.service';
import { LocalStorageService } from 'services/local-storage.service';
import { STORAGE_PROVIDER } from 'storage/storage-provider.interface';
import { FileGrpcController } from 'controllers/file.grpc.controller';
import { ImageResizeConsumer } from 'consumers/image-resize.consumer';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'file-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([Image, Video]),
        ClientsModule.registerAsync([
            {
                name: 'IMAGE_EVENTS',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'image_resize_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    controllers: [FileGrpcController, ImageResizeConsumer],
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
        ImageProcessingService,
        ImageResizeService,
        ImageService,
        VideoService,
    ],
})
export class AppModule {}

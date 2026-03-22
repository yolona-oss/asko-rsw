import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { Image } from 'entities/image.entity';
import { ImageService } from 'services/image.service';
import { ImageProcessingService } from 'services/image-processing.service';
import { CloudinaryService } from 'services/cloudinary.service';
import { LocalStorageService } from 'services/local-storage.service';
import { STORAGE_PROVIDER } from 'storage/storage-provider.interface';
import { FileGrpcController } from 'controllers/file.grpc.controller';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([Image]),
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
        ImageProcessingService,
        ImageService,
    ],
})
export class AppModule {}

import { Global, Module } from '@nestjs/common';
import { FileStorageMode } from '@asko/shared';
import { AppConfig } from 'app.config';
import { STORAGE_PROVIDER } from 'storage/storage-provider.interface';
import { CloudinaryService } from 'storage/cloudinary.service';
import { LocalStorageService } from 'storage/local-storage.service';
import { S3StorageService } from 'storage/s3-storage.service';

@Global()
@Module({
    providers: [
        {
            provide: STORAGE_PROVIDER,
            useFactory: (config: AppConfig) => {
                switch (config.fileStorageMode) {
                    case FileStorageMode.LOCAL: return new LocalStorageService(config);
                    case FileStorageMode.S3:    return new S3StorageService(config);
                    default:                    return new CloudinaryService();
                }
            },
            inject: [AppConfig],
        },
    ],
    exports: [STORAGE_PROVIDER],
})
export class StorageModule {}

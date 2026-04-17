import { Global, Module } from '@nestjs/common';
import { AppConfig } from '../app.config';
import { STORAGE_PROVIDER } from 'storage/storage-provider.interface';
import { CloudinaryService } from 'services/cloudinary.service';
import { LocalStorageService } from 'services/local-storage.service';

@Global()
@Module({
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
    ],
    exports: [STORAGE_PROVIDER],
})
export class StorageModule {}

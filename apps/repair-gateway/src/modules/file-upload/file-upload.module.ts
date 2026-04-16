import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { RepairImageUploadController } from './controllers/image.controller';
import { RepairVideoUploadController } from './controllers/video.controller';
import { RepairDocumentUploadController } from './controllers/document.controller';

@Module({
    imports: [RepairClientModule],
    controllers: [
        RepairImageUploadController,
        RepairVideoUploadController,
        RepairDocumentUploadController,
    ],
})
export class FileUploadModule {}

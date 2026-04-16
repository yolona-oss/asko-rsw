import { Module } from '@nestjs/common';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { ArticleImageUploadController } from './controllers/image.controller';
import { ArticleVideoUploadController } from './controllers/video.controller';

@Module({
    imports: [FileClientModule],
    controllers: [ArticleImageUploadController, ArticleVideoUploadController],
})
export class FileUploadModule {}

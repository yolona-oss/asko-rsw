import { Module } from '@nestjs/common';
import { ArticleImageUploadController } from './controllers/image.controller';
import { ArticleVideoUploadController } from './controllers/video.controller';

@Module({
    controllers: [ArticleImageUploadController, ArticleVideoUploadController],
})
export class FileUploadModule {}

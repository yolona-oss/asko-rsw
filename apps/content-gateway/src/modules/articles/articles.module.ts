import { Module } from '@nestjs/common';
import { ArticlesController } from './controllers/articles.controller';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { ContentClientModule } from 'modules/content-client/content-client.module';

@Module({
    imports: [ContentClientModule, FileClientModule],
    controllers: [ArticlesController],
})
export class ArticlesModule {}

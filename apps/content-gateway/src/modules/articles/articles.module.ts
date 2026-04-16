import { Module } from '@nestjs/common';
import { ArticlesController } from './controllers/articles.controller';
import { ContentClientModule } from 'modules/content-client/content-client.module';

@Module({
    imports: [ContentClientModule],
    controllers: [ArticlesController],
})
export class ArticlesModule {}

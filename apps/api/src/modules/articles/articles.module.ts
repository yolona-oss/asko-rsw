import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Article } from 'entities';
import { ArticlesService } from './services/articles.service';
import { ArticlesController } from './controllers/articles.controller';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';

@Module({
    imports: [MikroOrmModule.forFeature([Article]), FileUploadModule],
    controllers: [ArticlesController],
    providers: [ArticlesService],
    exports: [ArticlesService],
})
export class ArticlesModule {}

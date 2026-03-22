import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Article } from 'entities';
import { ArticlesService } from './services/articles.service';
import { ArticlesController } from './controllers/articles.controller';
import { FileClientModule } from 'modules/file-client/file-client.module';

@Module({
    imports: [MikroOrmModule.forFeature([Article]), FileClientModule],
    controllers: [ArticlesController],
    providers: [ArticlesService],
    exports: [ArticlesService],
})
export class ArticlesModule {}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MetricsModule } from '@asko/observability';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { Article } from 'entities/article.entity';
import { ArticleView } from 'entities/article-view.entity';
import { ContentService } from 'services/content.service';
import { ContentGrpcController } from 'controllers/content.grpc.controller';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'content-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([Article, ArticleView]),
    ],
    controllers: [ContentGrpcController],
    providers: [ContentService],
})
export class AppModule {}

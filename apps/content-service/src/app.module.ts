import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MetricsModule } from '@asko/observability';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { Article } from 'entities/article.entity';
import { ArticleView } from 'entities/article-view.entity';
import { ArticleEdge } from 'entities/article-edge.entity';
import { ContentService } from 'services/content.service';
import { GraphService } from 'services/graph.service';
import { ContentGrpcController } from 'controllers/content.grpc.controller';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'content-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([Article, ArticleView, ArticleEdge]),
    ],
    controllers: [ContentGrpcController],
    providers: [ContentService, GraphService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfig } from '../app.config';
import { Article } from 'entities/article.entity';
import { ArticleView } from 'entities/article-view.entity';
import { ArticleEdge } from 'entities/article-edge.entity';
import { isProdEnv } from '@asko/shared';
import path from 'path';

@Module({
    imports: [
        MikroOrmModule.forRootAsync({
            useFactory: (config: AppConfig) => {
                return {
                    driver: PostgreSqlDriver,
                    user: config.database.user,
                    password: config.database.pass,
                    dbName: config.database.name,
                    host: config.database.host,
                    port: parseInt(config.database.port),
                    entities: [Article, ArticleView, ArticleEdge],
                    migrations: {
                        path: path.join(process.cwd(), 'migrations'),
                    },
                    debug: !isProdEnv(),
                };
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule {}

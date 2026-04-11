import 'tsconfig-paths/register';
import { config as dotenvConfig } from 'dotenv';
import { getEnvFilePath } from '@asko/shared';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import { Article } from 'entities/article.entity';
import { ArticleView } from 'entities/article-view.entity';
import { ArticleEdge } from 'entities/article-edge.entity';
import { ArticleTag } from 'entities/article-tag.entity';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'app.config';

dotenvConfig({ path: getEnvFilePath(), override: true });

const configService = new ConfigService();
const appConfig = new AppConfig(configService);

const config = defineConfig<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    user: appConfig.database.user,
    password: appConfig.database.pass,
    dbName: appConfig.database.name,
    host: appConfig.database.host,
    port: parseInt(appConfig.database.port),
    entities: [Article, ArticleView, ArticleEdge, ArticleTag],
    migrations: {
        path: path.join(process.cwd(), 'migrations'),
    },
    seeder: {
        path: path.join(process.cwd(), 'src/seeders'),
        defaultSeeder: 'DevSeeder',
    },
    debug: process.env.NODE_ENV !== 'production',
});

export default config;

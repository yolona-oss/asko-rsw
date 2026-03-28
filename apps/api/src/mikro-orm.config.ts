import 'tsconfig-paths/register';
import { config as dotenvConfig } from 'dotenv';
import { getEnvFilePath } from '@asko/shared';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import {
    Article,
    ArticleView,
    WSchedule,
    Cursor,
} from '@entities/index'

import { AppConfig } from 'app.config';
import { ConfigService } from '@nestjs/config';

dotenvConfig({ path: getEnvFilePath(), override: true });

const configService = new ConfigService();
const app_config = new AppConfig(configService);

const config = defineConfig<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    user: app_config.database.user,
    password: app_config.database.pass,
    dbName: app_config.database.name,
    host: app_config.database.host,
    port: parseInt(app_config.database.port),
    // highlighter: HighlightRegistry,
    // driverOptions: {
    //     connection: {
    //         ssl: isProdEnv() ? {
    //             rejectUnauthorized: true,
    //             ca: readFileSync('.postgres/root.crt')
    //         } : {}
    //     }
    // },
    entities: [
        Article,
        ArticleView,
        WSchedule,
        Cursor,
    ],
    migrations: {
        path: path.join(process.cwd(), 'migrations'),
        // pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    debug: process.env.NODE_ENV !== 'production',
})

export default config;

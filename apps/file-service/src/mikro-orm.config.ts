import 'tsconfig-paths/register';
import { config as dotenvConfig } from 'dotenv';
import { getEnvFilePath } from '@asko/shared';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import { Image } from 'image/image.entity';
import { Video } from 'video/video.entity';
import { FileAccess } from 'common/file-access.entity';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'app.config';
import { Document } from 'document/document.entity';

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
    entities: [Image, Video, Document, FileAccess],
    migrations: {
        path: path.join(process.cwd(), 'migrations'),
    },
    debug: process.env.NODE_ENV !== 'production',
});

export default config;

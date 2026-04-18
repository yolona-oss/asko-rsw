import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfig } from 'app.config';
import { Image } from 'image/image.entity';
import { Video } from 'video/video.entity';
import { FileAccess } from 'common/file-access.entity';
import { isProdEnv } from '@asko/shared';
import { Document } from 'document/document.entity';

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
                    entities: [Image, Document, Video, FileAccess],
                    debug: !isProdEnv(),
                };
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule { }

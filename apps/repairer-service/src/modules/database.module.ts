import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfig } from '../app.config';
import { Repairer } from 'entities/repairer.entity';
import { Review } from 'entities/review.entity';
import { isProdEnv } from '@asko/shared';

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
                    entities: [Repairer, Review],
                    debug: !isProdEnv(),
                };
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule {}

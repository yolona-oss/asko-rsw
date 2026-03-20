import { Module } from "@nestjs/common"
import { AppConfig } from "../app.config";

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { User, Session, InvitationLink, UserAddress } from 'entities'
import { isProdEnv } from "@asko/shared";

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
                    entities: [
                        User,
                        Session,
                        InvitationLink,
                        UserAddress,
                    ],
                    debug: !isProdEnv(),
                }
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule { }

import { Module } from "@nestjs/common"
import { AppConfig } from "app.config";

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import {
    Article,
    RepairRequest,
    Review,
    WSchedule,
    Employee,
    Certificate,
    Cursor,
    PointsTransaction,
    PointsWithdrawal,
    UserDevice,
    InvitationLink,
    UserAddress,
    Session,
    User,
    DealerProfile,
    Address,
    DealerClient,
    WorkStep,
    Image,
    Device,
    Repairer
} from 'entities'
import path from "path";
import { isProdEnv } from "@asko/shared";
import { readFileSync } from "fs";

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
                    // driverOptions: {
                    //     connection: {
                    //         ssl: isProdEnv() ? {
                    //             rejectUnauthorized: true,
                    //             ca: readFileSync('.postgres/root.crt')
                    //         } : false
                    //     }
                    // },
                    entities: [
                        Article,
                        RepairRequest,
                        Review,
                        WSchedule,
                        Employee,
                        Certificate,
                        Cursor,
                        PointsTransaction,
                        PointsWithdrawal,
                        UserDevice,
                        InvitationLink,
                        UserAddress,
                        Session,
                        User,
                        DealerProfile,
                        Address,
                        DealerClient,
                        WorkStep,
                        Image,
                        Device,
                        Repairer
                    ],
                    migrations: {
                        path: path.join(process.cwd(), 'migrations'),
                        // pattern: /^[\w-]+\d+\.[tj]s$/,
                    },
                    debug: !isProdEnv(),
                }
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule { }

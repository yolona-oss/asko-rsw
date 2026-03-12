import { Module } from "@nestjs/common"
import { AppConfig } from "app.config";

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import {
    WSchedule,
    Employee,
    Session,
    User,
    InvitationLink,
    UserAddress,
    Payment,
    Address,
    Image,
    Device,
    UserDevice,
    Certificate,
    Repairer,
    RepairRequest,
    WorkStep,
    RepairPayment,
    Review,
    DealerProfile,
    DealerClient,
    PointsTransaction,
    PointsWithdrawal,
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
                    driverOptions: {
                        connection: {
                            ssl: isProdEnv() ? {
                                rejectUnauthorized: true,
                                ca: readFileSync('ca.pem')
                            } : false
                        },
                        pool: {
                            min: 0,
                            max: 5, // NOTE for dev opt on free trial server
                        },
                    },
                    entities: [
                        WSchedule,
                        Employee,
                        Session,
                        User,
                        InvitationLink,
                        UserAddress,
                        Payment,
                        Address,
                        Image,
                        Device,
                        UserDevice,
                        Certificate,
                        Repairer,
                        RepairRequest,
                        WorkStep,
                        RepairPayment,
                        Review,
                        DealerProfile,
                        DealerClient,
                        PointsTransaction,
                        PointsWithdrawal,
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

import 'tsconfig-paths/register';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
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
    RepairPayment,
    UserDevice,
    InvitationLink,
    UserAddress,
    Session,
    User,
    DealerProfile,
    Payment,
    Address,
    DealerClient,
    WorkStep,
    Image,
    Device,
    Repairer
} from '@entities/index'

import { AppConfig } from 'app.config';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { isProdEnv } from '@asko/shared';

const configService = new ConfigService();
const app_config = new AppConfig(configService);

const config = defineConfig<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    user: app_config.database.user,
    password: app_config.database.pass,
    dbName: app_config.database.name,
    host: app_config.database.host,
    port: parseInt(app_config.database.port),
    // highlighter: ,
    // driverOptions: {
    //     connection: isProdEnv() ? {
    //         ssl: {
    //             rejectUnauthorized: true,
    //             ca: readFileSync('./ca.pem').toString(),
    //         },
    //     } : {}
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
        RepairPayment,
        UserDevice,
        InvitationLink,
        UserAddress,
        Session,
        User,
        DealerProfile,
        Payment,
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
    debug: process.env.NODE_ENV !== 'production',
})

export default config;

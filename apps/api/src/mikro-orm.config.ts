import 'tsconfig-paths/register';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import {
    WSchedule,
    Employee,
    Session,
    User,
    UserAddress,
    Payment,
    Address,
    Image,
    InvitationLink,
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
    driverOptions: {
        connection: isProdEnv() ? {
            ssl: {
                rejectUnauthorized: true,
                ca: readFileSync('./ca.pem').toString(),
            },
        } : {}
    },
    entities: [
        WSchedule,
        Employee,
        Session,
        User,
        UserAddress,
        Payment,
        Address,
        Image,
        InvitationLink,
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
    debug: process.env.NODE_ENV !== 'production',
})

export default config;

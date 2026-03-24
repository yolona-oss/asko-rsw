import 'tsconfig-paths/register';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import {
    Device,
    Address,
    UserDevice,
    Certificate,
    Repairer,
    Review,
    RepairRequest,
    WorkStep,
    DealerProfile,
    DealerClient,
    PointsTransaction,
    PointsWithdrawal,
} from 'entities';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'app.config';

const configService = new ConfigService();
const appConfig = new AppConfig(configService);

const config = defineConfig<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    user: appConfig.database.user,
    password: appConfig.database.pass,
    dbName: appConfig.database.name,
    host: appConfig.database.host,
    port: parseInt(appConfig.database.port),
    entities: [
        Device,
        Address,
        UserDevice,
        Certificate,
        Repairer,
        Review,
        RepairRequest,
        WorkStep,
        DealerProfile,
        DealerClient,
        PointsTransaction,
        PointsWithdrawal,
    ],
    migrations: {
        path: path.join(process.cwd(), 'migrations'),
    },
    debug: process.env.NODE_ENV !== 'production',
});

export default config;

import 'tsconfig-paths/register';
import { config as dotenvConfig } from 'dotenv';
import { getEnvFilePath } from '@asko/shared';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import {
    DeviceCategory,
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
    WSchedule,
    WSchedulePattern,
} from './entities';

dotenvConfig({ path: getEnvFilePath(), override: true });

const config = defineConfig<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    dbName: process.env.DATABASE_DB_NAME,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    entities: [
        DeviceCategory,
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
        WSchedule,
        WSchedulePattern,
    ],
    migrations: {
        path: path.join(process.cwd(), 'migrations'),
    },
    seeder: {
        path: path.join(process.cwd(), 'src/seeders'),
        defaultSeeder: 'DevSeeder',
    },
    debug: process.env.NODE_ENV !== 'production',
});

export default config;

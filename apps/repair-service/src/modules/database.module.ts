import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfig } from '../app.config';
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
    DevicePart,
    BrokenPart,
    WSchedule,
    WSchedulePattern,
} from '../entities';
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
                        DevicePart,
                        BrokenPart,
                        WSchedule,
                        WSchedulePattern,
                    ],
                    debug: !isProdEnv(),
                };
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule {}

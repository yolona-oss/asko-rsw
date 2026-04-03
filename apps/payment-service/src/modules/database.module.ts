import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfig } from '../app.config';
import { PaymentEntity } from 'entities/payment.entity';
import { PaymentAuditEntity } from 'entities/payment-audit.entity';
import { FailedEventEntity } from 'entities/failed-event.entity';
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
                    entities: [PaymentEntity, PaymentAuditEntity, FailedEventEntity],
                    debug: !isProdEnv(),
                };
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule {}

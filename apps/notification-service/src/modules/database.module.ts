import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfig } from '../app.config';
import { NotificationEntity } from 'entities/notification.entity';
import { ReminderJobEntity } from 'entities/reminder-job.entity';
import { AudienceMembershipEntity } from 'entities/audience-membership.entity';
import { NotificationPreferencesEntity } from 'entities/notification-preferences.entity';
import { PushSubscriptionEntity } from 'entities/push-subscription.entity';
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
                    entities: [NotificationEntity, ReminderJobEntity, AudienceMembershipEntity, NotificationPreferencesEntity, PushSubscriptionEntity],
                    debug: !isProdEnv(),
                };
            },
            inject: [AppConfig],
        }),
    ],
})
export class DatabaseModule {}

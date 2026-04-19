import 'tsconfig-paths/register';
import { config as dotenvConfig } from 'dotenv';
import { getEnvFilePath } from '@asko/shared';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import { NotificationEntity } from 'entities/notification.entity';
import { ReminderJobEntity } from 'entities/reminder-job.entity';
import { AudienceMembershipEntity } from 'entities/audience-membership.entity';
import { NotificationPreferencesEntity } from 'entities/notification-preferences.entity';
import { PushSubscriptionEntity } from 'entities/push-subscription.entity';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'app.config';

dotenvConfig({ path: getEnvFilePath(), override: true });

const configService = new ConfigService();
const appConfig = new AppConfig(configService);

const config = defineConfig<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    user: appConfig.database.user,
    password: appConfig.database.pass,
    dbName: appConfig.database.name,
    host: appConfig.database.host,
    port: parseInt(appConfig.database.port),
    entities: [NotificationEntity, ReminderJobEntity, AudienceMembershipEntity, NotificationPreferencesEntity, PushSubscriptionEntity],
    migrations: {
        path: path.join(process.cwd(), 'migrations'),
    },
    debug: process.env.NODE_ENV !== 'production',
});

export default config;

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@asko/observability';
import { JwtGuard, GATEWAY_CONFIG, UserClientModule } from '@asko/gateway-common';

import { AppConfig, AppConfigModule } from './app.config';

import { ChatModule } from 'modules/chat/chat.module';
import { NotificationModule } from 'modules/notification/notification.module';
import { HealthModule } from 'modules/health/health.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'realtime-gateway' }),
        JwtModule,

        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
        ChatModule,
        NotificationModule,
        HealthModule,
    ],
    providers: [
        { provide: GATEWAY_CONFIG, useExisting: AppConfig },
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
    ],
})
export class AppModule { }

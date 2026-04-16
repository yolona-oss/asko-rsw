import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MetricsModule } from '@asko/observability';
import { JwtGuard, GATEWAY_CONFIG, UserClientModule } from '@asko/gateway-common';

import { AppConfig, AppConfigModule } from './app.config';

import { AuthModule } from 'modules/auth/auth.module';
import { OAuthModule } from 'modules/oauth/oauth.module';
import { InviteModule } from 'modules/invite/invite.module';
import { UserModule } from 'modules/user/user.module';
import { HealthModule } from 'modules/health/health.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'auth-gateway' }),
        JwtModule,

        // Default: 60 requests per minute per IP
        ThrottlerModule.forRoot([{
            ttl: 60_000,
            limit: 60,
        }]),

        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
        AuthModule,
        OAuthModule,
        InviteModule,
        UserModule,
        HealthModule,
    ],
    providers: [
        { provide: GATEWAY_CONFIG, useExisting: AppConfig },
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }

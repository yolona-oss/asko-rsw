import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MetricsModule } from '@asko/observability';
import { AuthorizationModule } from '@asko/authorization';
import { JwtGuard, GATEWAY_CONFIG, UserClientModule, FileClientModule } from '@asko/gateway-common';

import { AppConfig, AppConfigModule } from './app.config';

import { AuthFileClientService } from 'modules/file-client/file-client.service';
import { AuthModule } from 'modules/auth/auth.module';
import { OAuthModule } from 'modules/oauth/oauth.module';
import { InviteModule } from 'modules/invite/invite.module';
import { UserModule } from 'modules/user/user.module';
import { HealthModule } from 'modules/health/health.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'auth-gateway' }),
        AuthorizationModule.forRoot(),
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

        FileClientModule.registerAsync({
            serviceClass: AuthFileClientService,
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ fileServiceUrl: config.fileServiceUrl }),
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

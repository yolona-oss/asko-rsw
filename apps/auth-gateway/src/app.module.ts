import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@asko/observability';

import { AppConfigModule } from './app.config';

import { JwtGuard } from './common/guards/jwt.guard';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { AuthModule } from 'modules/auth/auth.module';
import { OAuthModule } from 'modules/oauth/oauth.module';
import { InviteModule } from 'modules/invite/invite.module';
import { HealthModule } from 'modules/health/health.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'auth-gateway' }),
        JwtModule,

        UserClientModule,
        AuthModule,
        OAuthModule,
        InviteModule,
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
    ],
})
export class AppModule { }

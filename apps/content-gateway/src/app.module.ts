import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@asko/observability';
import { JwtGuard, GATEWAY_CONFIG, FileClientModule } from '@asko/gateway-common';

import { AppConfig, AppConfigModule } from './app.config';

import { ArticlesModule } from 'modules/articles/articles.module';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';
import { HealthModule } from 'modules/health/health.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'content-gateway' }),
        JwtModule,

        FileClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ fileServiceUrl: config.fileServiceUrl }),
        }),

        ArticlesModule,
        FileUploadModule,
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

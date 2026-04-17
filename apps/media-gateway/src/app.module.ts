import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@asko/observability';
import { AuthorizationModule } from '@asko/authorization';
import { JwtGuard, GATEWAY_CONFIG, UserClientModule, FileClientModule } from '@asko/gateway-common';
import { join } from 'path';

import { AppConfig, AppConfigModule } from './app.config';

import { FileUploadModule } from 'modules/file-upload/file-upload.module';
import { FileAccessModule } from 'modules/file-access/file-access.module';
import { HealthModule } from 'modules/health/health.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'media-gateway' }),
        AuthorizationModule.forRoot(),
        JwtModule,

        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),

        FileClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ fileServiceUrl: config.fileServiceUrl }),
        }),

        // Legacy static file serving for old URLs in DB (/images/*, /videos/*)
        ServeStaticModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => [
                {
                    rootPath: join(process.cwd(), config.staticPath),
                    serveRoot: '/images',
                    serveStaticOptions: { cacheControl: true, extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'webp'] },
                },
                {
                    rootPath: join(process.cwd(), config.staticPath, 'videos'),
                    serveRoot: '/videos',
                    serveStaticOptions: { cacheControl: true, extensions: ['mp4', 'webm', 'mov'] },
                },
            ],
        }),

        FileUploadModule,
        FileAccessModule,
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

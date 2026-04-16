import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Algorithm } from 'jsonwebtoken';
import { getEnvFilePath } from '@asko/shared';

import ms from 'ms'

@Injectable()
export class AppConfig {
    constructor(private readonly configService: ConfigService) { }

    get app_name() {
        return "asko-rws";
    }

    get frontendUrl() {
        return this.configService.getOrThrow<string>('FRONTEND_URL');
    }

    get port() {
        const port = this.configService.getOrThrow<string>('PORT');
        return parseInt(port || '') || 4001;
    }

    get cookieSecret() {
        return this.configService.get<string>('COOKIE_SECRET', 'default-cookie-secret');
    }

    get userServiceUrl(): string {
        return this.configService.get<string>('USER_SERVICE_ADDR') ?? 'localhost:5000';
    }

    get fileServiceUrl(): string {
        return this.configService.get<string>('FILE_SERVICE_ADDR') ?? 'localhost:5002';
    }

    get oauth() {
        return {
            google: {
                clientId: this.configService.get('GOOGLE_CLIENT_ID', ''),
                clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET', ''),
            },
            vk: {
                clientId: this.configService.get('VK_CLIENT_ID', ''),
                clientSecret: this.configService.get('VK_CLIENT_SECRET', ''),
            },
            yandex: {
                clientId: this.configService.get('YANDEX_CLIENT_ID', ''),
                clientSecret: this.configService.get('YANDEX_CLIENT_SECRET', ''),
            },
            callbackBaseUrl: this.configService.get('OAUTH_CALLBACK_URL', 'http://localhost:4001'),
        };
    }

    get jwt() {
        return {
            algorithm: this.configService.getOrThrow<string>('JWT_ALGORITHM') as Algorithm,
            access_token: {
                public_key: this.configService.getOrThrow<string>('JWT_ACCESS_PUBLIC_KEY'),
                private_key: this.configService.getOrThrow<string>('JWT_ACCESS_PRIVATE_KEY'),
                sign_options: {
                    expires_in: parseInt(this.configService.getOrThrow<ms.StringValue>('JWT_ACCESS_EXPIRES_IN')),
                },
            },
        };
    }
}

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            expandVariables: true,
            envFilePath: getEnvFilePath(),
            cache: true,
        }),
    ],
    providers: [AppConfig],
    exports: [AppConfig],
})
export class AppConfigModule { }

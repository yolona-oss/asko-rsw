// import dotenv from 'dotenv'
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

    get serverUrl() {
        return this.configService.getOrThrow<string>('SERVER_URL');
    }

    get frontendUrl() {
        return this.configService.getOrThrow<string>('FRONTEND_URL');
    }

    get port() {
        const port = this.configService.getOrThrow<string>('PORT');
        return parseInt(port || '') || 4000;
    }

    get staticPath() {
        return this.configService.getOrThrow<string>('STATIC_PATH');
    }

    get userServiceUrl(): string {
        return this.configService.get<string>('USER_SERVICE_URL') ?? 'localhost:5000';
    }

    get paymentServiceUrl(): string {
        return this.configService.get<string>('PAYMENT_SERVICE_URL') ?? 'localhost:5001';
    }

    get fileServiceUrl(): string {
        return this.configService.get<string>('FILE_SERVICE_URL') ?? 'localhost:5002';
    }

    get repairServiceUrl(): string {
        return this.configService.get<string>('REPAIR_SERVICE_URL') ?? 'localhost:5003';
    }

    get notificationServiceUrl(): string {
        return this.configService.get<string>('NOTIFICATION_SERVICE_URL') ?? 'localhost:5004';
    }

    get chatServiceUrl(): string {
        return this.configService.get<string>('CHAT_SERVICE_URL') ?? 'localhost:5005';
    }

    get contentServiceUrl(): string {
        return this.configService.get<string>('CONTENT_SERVICE_URL') ?? 'localhost:5010';
    }

    get jwt() {
        return {
            algorithm: this.configService.getOrThrow<string>('JWT_ALGORITHM') as Algorithm,
            access_token: {
                public_key: this.configService.getOrThrow<string>('ACCESS_JWT_TOKEN_PUBLIC_KEY'),
                private_key: this.configService.getOrThrow<string>('ACCESS_JWT_TOKEN_PRIVATE_KEY'),
                sign_options: {
                    expires_in: parseInt(this.configService.getOrThrow<ms.StringValue>('ACCESS_JWT_TOKEN_OPTION_EXPIRES_IN')),
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

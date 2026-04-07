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

    get port() {
        const port = this.configService.getOrThrow<string>('PORT');
        return parseInt(port || '') || 4002;
    }

    get cookieSecret() {
        return this.configService.get<string>('COOKIE_SECRET', 'default-cookie-secret');
    }

    get userServiceUrl(): string {
        return this.configService.get<string>('USER_SERVICE_ADDR') ?? 'localhost:5000';
    }

    get paymentServiceUrl(): string {
        return this.configService.get<string>('PAYMENT_SERVICE_ADDR') ?? 'localhost:5001';
    }

    get fileServiceUrl(): string {
        return this.configService.get<string>('FILE_SERVICE_ADDR') ?? 'localhost:5002';
    }

    get repairServiceUrl(): string {
        return this.configService.get<string>('REPAIR_SERVICE_ADDR') ?? 'localhost:5003';
    }

    get chatServiceUrl(): string {
        return this.configService.get<string>('CHAT_SERVICE_ADDR') ?? 'localhost:5005';
    }

    get redisUrl(): string {
        return this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
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

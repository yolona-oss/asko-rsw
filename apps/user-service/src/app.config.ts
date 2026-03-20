import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { getEnvFilePath } from '@asko/shared';
import ms from 'ms'

@Injectable()
export class AppConfig {
    constructor(private readonly configService: ConfigService) { }

    get serverUrl() {
        return this.configService.getOrThrow<string>('SERVER_URL');
    }

    get frontendUrl() {
        return this.configService.getOrThrow<string>('FRONTEND_URL');
    }

    get port() {
        const port = this.configService.get<string>('GRPC_PORT');
        return parseInt(port || '') || 5000;
    }

    get database() {
        return {
            host: this.configService.getOrThrow<string>('DATABASE_HOST'),
            port: this.configService.getOrThrow<string>('DATABASE_PORT'),
            name: this.configService.getOrThrow<string>('DATABASE_DB_NAME'),
            user: this.configService.getOrThrow<string>('DATABASE_USER'),
            pass: this.configService.getOrThrow<string>('DATABASE_PASS'),
        };
    }

    get jwt() {
        return {
            algorithm: this.configService.getOrThrow<string>('JWT_ALGORITHM') as Algorithm,
            email_confirmation: {
                public_key: this.configService.getOrThrow<string>('EMAIL_CONFIRMATION_TOKEN_PUBLIC_KEY'),
                private_key: this.configService.getOrThrow<string>('EMAIL_CONFIRMATION_TOKEN_PRIVATE_KEY'),
                sign_options: {
                    expires_in: this.configService.getOrThrow<ms.StringValue>('EMAIL_CONFIRMATION_TOKEN_EXPIRES_IN')
                }
            },
            access_token: {
                public_key: this.configService.getOrThrow<string>('ACCESS_JWT_TOKEN_PUBLIC_KEY'),
                private_key: this.configService.getOrThrow<string>('ACCESS_JWT_TOKEN_PRIVATE_KEY'),
                sign_options: {
                    expires_in: parseInt(this.configService.getOrThrow<ms.StringValue>('ACCESS_JWT_TOKEN_OPTION_EXPIRES_IN')),
                },
            },
            refresh_token: {
                public_key: this.configService.getOrThrow<string>('REFRESH_JWT_TOKEN_PUBLIC_KEY'),
                private_key: this.configService.getOrThrow<string>('REFRESH_JWT_TOKEN_PRIVATE_KEY'),
                sign_options: {
                    expires_in: this.configService.getOrThrow<ms.StringValue>('REFRESH_JWT_TOKEN_OPTION_EXPIRES_IN'),
                },
            },
            reset_token: {
                sign_options: {
                    expires_in: this.configService.getOrThrow<ms.StringValue>('RESET_PASSWORD_TOKEN_EXPIRES_IN'),
                }
            }
        };
    }

    get email() {
        return {
            config: {
                host: this.configService.getOrThrow<string>('EMAIL_HOST'),
                smtp: {
                    port: this.configService.getOrThrow<string>('EMAIL_SMTP_PORT'),
                },
                auth: {
                    user: this.configService.getOrThrow<string>('EMAIL_AUTH_USER'),
                    pass: this.configService.getOrThrow<string>('EMAIL_AUTH_PASS'),
                },
            },
            from: this.configService.getOrThrow<string>('EMAIL_FROM'),
        };
    }

    get defaultUser() {
        return {
            name: this.configService.getOrThrow<string>('DEFAULT_USER_NAME'),
            email: this.configService.getOrThrow<string>('DEFAULT_USER_EMAIL'),
            phone: this.configService.getOrThrow<string>('DEFAULT_USER_PHONE'),
            password: this.configService.getOrThrow<string>('DEFAULT_USER_PASSWORD'),
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

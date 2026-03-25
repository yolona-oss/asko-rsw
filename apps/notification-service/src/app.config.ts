import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getEnvFilePath } from '@asko/shared';

@Injectable()
export class AppConfig {
    constructor(private readonly configService: ConfigService) {}

    get port(): number {
        return parseInt(this.configService.get<string>('PORT') || '') || 4100;
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

    get rabbitmq() {
        return {
            url: this.configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672',
        };
    }

    get redisUrl(): string {
        return this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
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
export class AppConfigModule {}

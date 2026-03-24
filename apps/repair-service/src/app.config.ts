import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getEnvFilePath } from '@asko/shared';

@Injectable()
export class AppConfig {
    constructor(private readonly configService: ConfigService) {}
    get port(): number { return parseInt(this.configService.get<string>('PORT') || '') || 4100; }
    get database() {
        return {
            host: this.configService.getOrThrow<string>('DATABASE_HOST'),
            port: this.configService.getOrThrow<string>('DATABASE_PORT'),
            name: this.configService.getOrThrow<string>('DATABASE_DB_NAME'),
            user: this.configService.getOrThrow<string>('DATABASE_USER'),
            pass: this.configService.getOrThrow<string>('DATABASE_PASS'),
        };
    }
    get paymentServiceUrl(): string { return this.configService.get<string>('PAYMENT_SERVICE_URL') ?? 'localhost:5001'; }
    get fileServiceUrl(): string { return this.configService.get<string>('FILE_SERVICE_URL') ?? 'localhost:5002'; }
}

@Global()
@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true, expandVariables: true, envFilePath: getEnvFilePath(), cache: true })],
    providers: [AppConfig],
    exports: [AppConfig],
})
export class AppConfigModule {}

import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getEnvFilePath, FileStorageMode } from '@asko/shared';

@Injectable()
export class AppConfig {
    constructor(private readonly configService: ConfigService) {}

    get port(): number {
        return parseInt(this.configService.get<string>('PORT') || '') || 4200;
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

    get fileStorageMode(): FileStorageMode {
        const raw = this.configService.get<string>('FILE_STORAGE_MODE');
        if (raw && Object.values(FileStorageMode).includes(raw as FileStorageMode)) {
            return raw as FileStorageMode;
        }
        return FileStorageMode.CLOUDINARY;
    }

    get staticPath(): string {
        return this.configService.getOrThrow<string>('STATIC_PATH');
    }

    get publicUrl(): string {
        return this.configService.getOrThrow<string>('PUBLIC_URL');
    }

    get redisUrl(): string {
        return this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    }

    get rabbitmq() {
        return {
            url: this.configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672',
        };
    }

    get cloudinary() {
        return {
            resolve_name: this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
        };
    }

    get s3() {
        return {
            bucket: this.configService.getOrThrow<string>('S3_BUCKET'),
            region: this.configService.get<string>('S3_REGION') ?? 'us-east-1',
            endpoint: this.configService.get<string>('S3_ENDPOINT'),
            accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
            prefix: this.configService.get<string>('S3_PREFIX') ?? '',
            cdnUrl: this.configService.get<string>('S3_CDN_URL'),
            forcePathStyle: this.configService.get<string>('S3_FORCE_PATH_STYLE') === 'true',
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
export class AppConfigModule {}

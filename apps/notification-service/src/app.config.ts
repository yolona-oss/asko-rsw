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

    get userServiceUrl(): string {
        return this.configService.get<string>('USER_SERVICE_ADDR') ?? 'localhost:5000';
    }

    get email() {
        return {
            host: this.configService.get<string>('EMAIL_HOST') ?? 'smtp.gmail.com',
            port: parseInt(this.configService.get<string>('EMAIL_SMTP_PORT') ?? '587'),
            user: this.configService.getOrThrow<string>('EMAIL_AUTH_USER'),
            pass: this.configService.getOrThrow<string>('EMAIL_AUTH_PASS'),
            from: this.configService.getOrThrow<string>('EMAIL_FROM'),
        };
    }

    get reminders() {
        return {
            paymentIntervalMs: parseInt(
                this.configService.get<string>('REMINDER_PAYMENT_INTERVAL_MS') ?? '1800000',
            ),
            paymentMaxFires: parseInt(
                this.configService.get<string>('REMINDER_PAYMENT_MAX_FIRES') ?? '3',
            ),
            repairAssignmentIntervalMs: parseInt(
                this.configService.get<string>('REMINDER_REPAIR_ASSIGNMENT_INTERVAL_MS') ?? '900000',
            ),
            repairAssignmentMaxFires: parseInt(
                this.configService.get<string>('REMINDER_REPAIR_ASSIGNMENT_MAX_FIRES') ?? '3',
            ),
            repairStuckAfterMs: parseInt(
                this.configService.get<string>('REMINDER_REPAIR_STUCK_AFTER_MS') ?? '28800000',
            ),
            sweepBatchSize: parseInt(
                this.configService.get<string>('REMINDER_SWEEP_BATCH_SIZE') ?? '100',
            ),
            advisoryLockKey: parseInt(
                this.configService.get<string>('REMINDER_ADVISORY_LOCK_KEY') ?? '94117',
            ),
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

import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';

import { UserService } from 'services/user.service';
import { AuthService } from 'services/auth.service';
import { InviteService } from 'services/invite.service';
import { LoginThrottleService } from 'services/login-throttle.service';
import { OtpService } from 'services/otp.service';
import { MfaService } from 'services/mfa.service';
import { EmailEventService } from 'services/email-event.service';
import { TokenCleanupService } from 'services/token-cleanup.service';
import { redisProvider } from 'providers/redis.provider';

import { UserGrpcController } from 'controllers/user.grpc.controller';
import { User, Session, InvitationLink, UserOAuthLink } from 'entities';
import { DatabaseModule } from 'modules/database.module';

@Module({
    controllers: [
        UserGrpcController,
    ],
    providers: [
        redisProvider,
        UserService,
        AuthService,
        InviteService,
        LoginThrottleService,
        OtpService,
        MfaService,
        EmailEventService,
        TokenCleanupService,
    ],
    imports: [
        AppConfigModule,
        ScheduleModule.forRoot(),
        MetricsModule.register({ serviceName: 'user-service' }),
        DatabaseModule,
        ClientsModule.registerAsync([
            {
                name: 'NOTIFICATION_SERVICE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'notification_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
        MikroOrmModule.forFeature([
            User,
            Session,
            InvitationLink,
            UserOAuthLink,
        ]),
        JwtModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({
                privateKey: Buffer.from(config.jwt.access_token.private_key, 'base64').toString('utf-8'),
                publicKey: Buffer.from(config.jwt.access_token.public_key, 'base64').toString('utf-8'),
                signOptions: {
                    expiresIn: config.jwt.access_token.sign_options.expires_in,
                    algorithm: config.jwt.algorithm
                },
            })
        }),
    ],
})
export class AppModule implements OnApplicationBootstrap {
    constructor(
        private userService: UserService,
        private config: AppConfig
    ) { }

    async onApplicationBootstrap(): Promise<void> {
        await this.userService.__createSuperAdmin({
            firstName: this.config.defaultUser.name,
            lastName: "admin",
            email: this.config.defaultUser.email,
            password: this.config.defaultUser.password
        })

        console.log(this.config)
    }
}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { PaymentEntity } from 'entities/payment.entity';
import { PaymentAuditEntity } from 'entities/payment-audit.entity';
import { FailedEventEntity } from 'entities/failed-event.entity';
import { PaymentService } from 'services/payment.service';
import { PaymentDomainService } from 'services/payment-domain.service';
import { PaymentEventService } from 'services/payment-event.service';
import { PaymentProviderService } from 'services/payment-provider.service';
import { PaymentLockService } from 'services/payment-lock.service';
import { PaymentExpirationService } from 'services/payment-expiration.service';
import { EventRetryService } from 'services/event-retry.service';
import { DummyProvider } from 'providers/dummy.provider';
import { YookassaProvider } from 'providers/yookassa.provider';
import { TbankProvider } from 'providers/tbank.provider';
import { redisProvider } from 'providers/redis.provider';
import { PaymentGrpcController } from 'controllers/payment.grpc.controller';
import { RepairCommandConsumer } from 'consumers/repair-command.consumer';

@Module({
    imports: [
        AppConfigModule,
        ScheduleModule.forRoot(),
        MetricsModule.register({ serviceName: 'payment-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([PaymentEntity, PaymentAuditEntity, FailedEventEntity]),
        ClientsModule.registerAsync([
            {
                name: 'EVENTS_SERVICE',
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
            {
                name: 'REPAIR_EVENTS_SERVICE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'repair_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    controllers: [PaymentGrpcController, RepairCommandConsumer],
    providers: [
        redisProvider,
        PaymentService,
        PaymentDomainService,
        PaymentEventService,
        PaymentProviderService,
        PaymentLockService,
        PaymentExpirationService,
        EventRetryService,
        DummyProvider,
        YookassaProvider,
        TbankProvider,
    ],
})
export class AppModule {}

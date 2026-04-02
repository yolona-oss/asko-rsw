import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { NotificationEntity } from 'entities/notification.entity';
import { NotificationService } from 'services/notification.service';
import { NotificationPushService } from 'services/notification-push.service';
import { NotificationEventPublisher } from 'services/notification-event.publisher';
import { NotificationGrpcController } from 'controllers/notification.grpc.controller';
import { PaymentEventConsumer } from 'consumers/payment-event.consumer';
import { RepairEventConsumer } from 'consumers/repair-event.consumer';
import { ChatEventConsumer } from 'consumers/chat-event.consumer';
import { EmailEventConsumer } from 'consumers/email-event.consumer';
import { EmailQueueModule } from 'modules/email-queue.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'notification-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([NotificationEntity]),
        EmailQueueModule,
        ClientsModule.registerAsync([
            {
                name: 'NOTIFICATION_EVENTS',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'chat_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    controllers: [
        NotificationGrpcController,
        PaymentEventConsumer,
        RepairEventConsumer,
        ChatEventConsumer,
        EmailEventConsumer,
    ],
    providers: [
        NotificationService,
        NotificationPushService,
        NotificationEventPublisher,
    ],
})
export class AppModule {}

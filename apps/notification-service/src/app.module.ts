import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { NotificationEntity } from 'entities/notification.entity';
import { ReminderJobEntity } from 'entities/reminder-job.entity';
import { NotificationService } from 'services/notification.service';
import { NotificationPushService } from 'services/notification-push.service';
import { NotificationEventPublisher } from 'services/notification-event.publisher';
import { ReminderService } from 'services/reminder.service';
import { ReminderSweepService } from 'services/reminder-sweep.service';
import { NotificationGrpcController } from 'controllers/notification.grpc.controller';
import { PaymentEventConsumer } from 'consumers/payment-event.consumer';
import { RepairEventConsumer } from 'consumers/repair-event.consumer';
import { ChatEventConsumer } from 'consumers/chat-event.consumer';
import { EmailEventConsumer } from 'consumers/email-event.consumer';
import { ScheduleEventConsumer } from 'consumers/schedule-event.consumer';
import { EmailQueueModule } from 'modules/email-queue.module';
import { UserClientModule } from 'modules/user-client/user-client.module';

@Module({
    imports: [
        AppConfigModule,
        ScheduleModule.forRoot(),
        MetricsModule.register({ serviceName: 'notification-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([NotificationEntity, ReminderJobEntity]),
        EmailQueueModule,
        UserClientModule,
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
        ScheduleEventConsumer,
    ],
    providers: [
        NotificationService,
        NotificationPushService,
        NotificationEventPublisher,
        ReminderService,
        ReminderSweepService,
    ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { EventBusModule, MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { NotificationEntity } from 'entities/notification.entity';
import { ReminderJobEntity } from 'entities/reminder-job.entity';
import { AudienceMembershipEntity } from 'entities/audience-membership.entity';
import { NotificationPreferencesEntity } from 'entities/notification-preferences.entity';
import { PushSubscriptionEntity } from 'entities/push-subscription.entity';
import { NotificationService } from 'services/notification.service';
import { NotificationPushService } from 'services/notification-push.service';
import { NotificationEventPublisher } from 'services/notification-event.publisher';
import { ReminderService } from 'services/reminder.service';
import { ReminderSweepService } from 'services/reminder-sweep.service';
import { AudienceProjectionService } from 'services/audience-projection.service';
import { NotificationPreferencesService } from 'services/notification-preferences.service';
import { PushSubscriptionService } from 'services/push-subscription.service';
import { UserInfoService } from 'services/user-info.service';
import { InAppChannel } from 'channels/in-app.channel';
import { WebPushChannel } from 'channels/web-push.channel';
import { EmailChannel } from 'channels/email.channel';
import { ChannelRegistry } from 'channels/channel-registry';
import { NotificationGrpcController } from 'controllers/notification.grpc.controller';
import { PaymentEventConsumer } from 'consumers/payment-event.consumer';
import { RepairEventConsumer } from 'consumers/repair-event.consumer';
import { ChatEventConsumer } from 'consumers/chat-event.consumer';
import { EmailEventConsumer } from 'consumers/email-event.consumer';
import { ScheduleEventConsumer } from 'consumers/schedule-event.consumer';
import { UserLifecycleEventConsumer } from 'consumers/user-lifecycle-event.consumer';
import { EmailQueueModule } from 'modules/email-queue.module';

@Module({
    imports: [
        AppConfigModule,
        ScheduleModule.forRoot(),
        MetricsModule.register({ serviceName: 'notification-service' }),
        EventBusModule.forRoot(),
        DatabaseModule,
        MikroOrmModule.forFeature([
            NotificationEntity,
            ReminderJobEntity,
            AudienceMembershipEntity,
            NotificationPreferencesEntity,
            PushSubscriptionEntity,
        ]),
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
            {
                name: 'USER_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'user',
                        protoPath: join(process.cwd(), '../../packages/proto/user.proto'),
                        url: config.userServiceUrl,
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
        UserLifecycleEventConsumer,
    ],
    providers: [
        NotificationService,
        NotificationPushService,
        NotificationEventPublisher,
        ReminderService,
        ReminderSweepService,
        AudienceProjectionService,
        NotificationPreferencesService,
        PushSubscriptionService,
        UserInfoService,
        InAppChannel,
        WebPushChannel,
        EmailChannel,
        ChannelRegistry,
    ],
})
export class AppModule {}

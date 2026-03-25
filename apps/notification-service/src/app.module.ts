import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { NotificationEntity } from 'entities/notification.entity';
import { NotificationService } from 'services/notification.service';
import { NotificationGrpcController } from 'controllers/notification.grpc.controller';
import { PaymentEventConsumer } from 'consumers/payment-event.consumer';
import { RepairEventConsumer } from 'consumers/repair-event.consumer';
import { ChatEventConsumer } from 'consumers/chat-event.consumer';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([NotificationEntity]),
    ],
    controllers: [
        NotificationGrpcController,
        PaymentEventConsumer,
        RepairEventConsumer,
        ChatEventConsumer,
    ],
    providers: [
        NotificationService,
    ],
})
export class AppModule {}

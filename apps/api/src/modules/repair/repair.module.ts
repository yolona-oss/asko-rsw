import { Module } from '@nestjs/common';
import { RepairRequestController } from './controllers/repair-request.controller';
import { RepairClientModule } from '../repair-client/repair-client.module';
import { UserClientModule } from '../user-client/user-client.module';
import { ChatClientModule } from '../chat-client/chat-client.module';
import { NotificationModule } from '../notification/notification.module';
import { FileClientModule } from '../file-client/file-client.module';
import { PaymentClientModule } from '../payment-client/payment-client.module';

@Module({
    imports: [
        RepairClientModule,
        UserClientModule,
        ChatClientModule,
        NotificationModule,
        FileClientModule,
        PaymentClientModule,
    ],
    controllers: [RepairRequestController],
})
export class RepairModule {}

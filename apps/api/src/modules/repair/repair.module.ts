import { Module } from '@nestjs/common';
import { RepairRequestController } from './controllers/repair-request.controller';
import { RepairClientModule } from '../repair-client/repair-client.module';
import { NotificationModule } from '../notification/notification.module';
import { FileClientModule } from '../file-client/file-client.module';
import { PaymentClientModule } from '../payment-client/payment-client.module';

@Module({
    imports: [
        RepairClientModule,
        NotificationModule,
        FileClientModule,
        PaymentClientModule,
    ],
    controllers: [RepairRequestController],
})
export class RepairModule {}

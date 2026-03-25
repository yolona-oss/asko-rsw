import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { DealerController } from './controllers/dealer.controller';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [RepairClientModule, UserClientModule, PaymentClientModule],
    controllers: [DealerController],
    exports: [RepairClientModule],
})
export class DealerModule {}

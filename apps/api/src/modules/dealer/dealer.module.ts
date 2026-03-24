import { Module } from '@nestjs/common';
import { DealerClientModule } from 'modules/dealer-client/dealer-client.module';
import { DealerController } from './controllers/dealer.controller';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [DealerClientModule, PaymentClientModule],
    controllers: [DealerController],
    exports: [DealerClientModule],
})
export class DealerModule {}

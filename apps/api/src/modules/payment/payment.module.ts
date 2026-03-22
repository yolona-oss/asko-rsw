import { Module } from '@nestjs/common';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';
import { PaymentController } from './payment.controller';

@Module({
    imports: [PaymentClientModule],
    controllers: [PaymentController],
})
export class PaymentModule {}

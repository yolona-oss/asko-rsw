import { Module } from '@nestjs/common';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';

@Module({
    imports: [PaymentClientModule, UserClientModule],
    controllers: [PaymentController, WebhookController],
})
export class PaymentModule {}

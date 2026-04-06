import { Module } from '@nestjs/common';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';
import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';

@Module({
    imports: [
        PaymentClientModule,
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
    ],
    controllers: [PaymentController, WebhookController],
})
export class PaymentModule {}

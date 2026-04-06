import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';
import { DealerController } from './controllers/dealer.controller';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [
        RepairClientModule,
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
        PaymentClientModule,
    ],
    controllers: [DealerController],
    exports: [RepairClientModule],
})
export class DealerModule {}

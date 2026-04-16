import { Module } from '@nestjs/common';
import { RepairRequestController } from './controllers/repair-request.controller';
import { RepairClientModule } from '../repair-client/repair-client.module';
import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';
import { ChatClientModule } from '../chat-client/chat-client.module';
import { PaymentClientModule } from '../payment-client/payment-client.module';

@Module({
    imports: [
        RepairClientModule,
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
        ChatClientModule,
        PaymentClientModule,
    ],
    controllers: [RepairRequestController],
})
export class RepairModule {}

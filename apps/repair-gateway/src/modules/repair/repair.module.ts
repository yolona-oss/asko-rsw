import { Module } from '@nestjs/common';
import { RepairRequestController } from './controllers/repair-request.controller';
import { RepairUploadController } from './controllers/repair-upload.controller';
import { RepairParticipantPolicy } from './policies/repair-participant.policy';
import { RepairManagerPolicy } from './policies/repair-manager.policy';
import { BrokenPartAccessPolicy } from './policies/broken-part-access.policy';
import { BrokenPartUploadPolicy } from './policies/broken-part-upload.policy';
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
    controllers: [RepairRequestController, RepairUploadController],
    providers: [RepairParticipantPolicy, RepairManagerPolicy, BrokenPartAccessPolicy, BrokenPartUploadPolicy],
    exports: [RepairParticipantPolicy, RepairManagerPolicy, BrokenPartAccessPolicy, BrokenPartUploadPolicy],
})
export class RepairModule {}

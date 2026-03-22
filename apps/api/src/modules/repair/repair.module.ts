import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RepairRequest, WorkStep, UserDevice, Certificate, Repairer } from 'entities';
import { RepairRequestService } from './services/repair-request.service';
import { WorkStepService } from './services/work-step.service';
import { RepairRequestController } from './controllers/repair-request.controller';
import { NotificationModule } from '../notification/notification.module';
import { FileClientModule } from '../file-client/file-client.module';
import { PaymentClientModule } from '../payment-client/payment-client.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([RepairRequest, WorkStep, UserDevice, Certificate, Repairer]),
        NotificationModule,
        FileClientModule,
        PaymentClientModule,
    ],
    controllers: [RepairRequestController],
    providers: [RepairRequestService, WorkStepService],
    exports: [RepairRequestService],
})
export class RepairModule { }

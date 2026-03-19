import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RepairRequest, WorkStep, RepairPayment, UserDevice, Certificate, Repairer } from 'entities';
import { RepairRequestService } from './services/repair-request.service';
import { WorkStepService } from './services/work-step.service';
import { RepairRequestController } from './controllers/repair-request.controller';
import { NotificationModule } from '../notification/notification.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([RepairRequest, WorkStep, RepairPayment, UserDevice, Certificate, Repairer]),
        NotificationModule,
        FileUploadModule,
        PaymentModule,
    ],
    controllers: [RepairRequestController],
    providers: [RepairRequestService, WorkStepService],
    exports: [RepairRequestService],
})
export class RepairModule {}

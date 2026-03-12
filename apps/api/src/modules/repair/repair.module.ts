import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RepairRequest, WorkStep, RepairPayment, UserDevice, Certificate, Repairer } from 'entities';
import { RepairRequestService } from './services/repair-request.service';
import { WorkStepService } from './services/work-step.service';
import { RepairPaymentService } from './services/repair-payment.service';
import { RepairRequestController } from './controllers/repair-request.controller';

@Module({
    imports: [MikroOrmModule.forFeature([RepairRequest, WorkStep, RepairPayment, UserDevice, Certificate, Repairer])],
    controllers: [RepairRequestController],
    providers: [RepairRequestService, WorkStepService, RepairPaymentService],
    exports: [RepairRequestService],
})
export class RepairModule {}

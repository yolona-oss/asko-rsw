import { forwardRef, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RepairRequest } from './entities/repair-request.entity';
import { WorkStep } from './entities/work-step.entity';
import { BrokenPart } from './entities/broken-part.entity';
import { WorkScheduleModule } from 'modules/schedule/schedule.module';
import { CertificateModule } from 'modules/certificate/certificate.module';
import { SupplierModule } from 'modules/supplier/supplier.module';
import { RepairGrpcController } from './controllers/repair.grpc.controller';
import { RepairRequestService } from './services/repair-request.service';
import { WorkStepService } from './services/work-step.service';
import { BrokenPartService } from './services/broken-part.service';
import { AvrPdfService } from './services/avr-pdf.service';

@Module({
    imports: [
        MikroOrmModule.forFeature([RepairRequest, WorkStep, BrokenPart]),
        WorkScheduleModule,
        CertificateModule,
        forwardRef(() => SupplierModule),
    ],
    controllers: [RepairGrpcController],
    providers: [
        RepairRequestService,
        WorkStepService,
        BrokenPartService,
        AvrPdfService,
    ],
    exports: [RepairRequestService, WorkStepService, BrokenPartService],
})
export class RepairRequestModule {}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { DeviceClientModule } from 'modules/device-client.module';
import { CertificateClientModule } from 'modules/certificate-client.module';
import { RepairerClientModule } from 'modules/repairer-client.module';
import { PaymentClientModule } from 'modules/payment-client.module';
import { RepairRequest } from 'entities/repair-request.entity';
import { WorkStep } from 'entities/work-step.entity';
import { RepairGrpcController } from 'controllers/repair.grpc.controller';
import { RepairRequestService } from 'services/repair-request.service';
import { WorkStepService } from 'services/work-step.service';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([RepairRequest, WorkStep]),
        DeviceClientModule,
        CertificateClientModule,
        RepairerClientModule,
        PaymentClientModule,
    ],
    controllers: [RepairGrpcController],
    providers: [RepairRequestService, WorkStepService],
})
export class AppModule {}

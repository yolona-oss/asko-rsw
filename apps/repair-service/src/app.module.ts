import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { PaymentClientModule } from 'modules/payment-client.module';
import { FileClientModule } from 'modules/file-client.module';
import {
    Device,
    Address,
    UserDevice,
    Certificate,
    Repairer,
    Review,
    RepairRequest,
    WorkStep,
    DealerProfile,
    DealerClient,
    PointsTransaction,
    PointsWithdrawal,
    DevicePart,
    BrokenPart,
} from 'entities';
import { DeviceGrpcController } from 'controllers/device.grpc.controller';
import { CertificateGrpcController } from 'controllers/certificate.grpc.controller';
import { RepairerGrpcController } from 'controllers/repairer.grpc.controller';
import { RepairGrpcController } from 'controllers/repair.grpc.controller';
import { DealerGrpcController } from 'controllers/dealer.grpc.controller';
import { DeviceService } from 'services/device.service';
import { AddressService } from 'services/address.service';
import { ExternalCertValidationService } from 'services/external-cert-validation.service';
import { CertificateService } from 'services/certificate.service';
import { RepairerService } from 'services/repairer.service';
import { ReviewService } from 'services/review.service';
import { RepairRequestService } from 'services/repair-request.service';
import { WorkStepService } from 'services/work-step.service';
import { DealerService } from 'services/dealer.service';
import { BrokenPartService } from 'services/broken-part.service';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([
            Device,
            Address,
            UserDevice,
            Certificate,
            Repairer,
            Review,
            RepairRequest,
            WorkStep,
            DealerProfile,
            DealerClient,
            PointsTransaction,
            PointsWithdrawal,
            DevicePart,
            BrokenPart,
        ]),
        PaymentClientModule,
        FileClientModule,
    ],
    controllers: [
        DeviceGrpcController,
        CertificateGrpcController,
        RepairerGrpcController,
        RepairGrpcController,
        DealerGrpcController,
    ],
    providers: [
        DeviceService,
        AddressService,
        ExternalCertValidationService,
        CertificateService,
        RepairerService,
        ReviewService,
        RepairRequestService,
        WorkStepService,
        BrokenPartService,
        DealerService,
    ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { RepairEventService } from 'modules/repair-event.service';
import { PaymentCommandService } from 'modules/payment-command.service';
import { AddressValidationPublisher } from 'modules/address-validation.service';
import { AddressValidationConsumer } from 'consumers/address-validation.consumer';
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
    WSchedule,
} from 'entities';
import { DeviceGrpcController } from 'controllers/device.grpc.controller';
import { CertificateGrpcController } from 'controllers/certificate.grpc.controller';
import { RepairerGrpcController } from 'controllers/repairer.grpc.controller';
import { RepairGrpcController } from 'controllers/repair.grpc.controller';
import { DealerGrpcController } from 'controllers/dealer.grpc.controller';
import { ScheduleGrpcController } from 'controllers/schedule.grpc.controller';
import { PaymentEventConsumer } from 'consumers/payment-event.consumer';
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
import { SignatureService } from 'services/signature.service';
import { WScheduleService } from 'services/wschedule.service';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'repair-service' }),
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
            WSchedule,
        ]),
        ClientsModule.registerAsync([
            {
                name: 'REPAIR_EVENTS',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'notification_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
            {
                name: 'PAYMENT_COMMANDS',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'payment_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
            {
                name: 'ADDRESS_VALIDATION',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'address_validation_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    controllers: [
        DeviceGrpcController,
        CertificateGrpcController,
        RepairerGrpcController,
        RepairGrpcController,
        DealerGrpcController,
        ScheduleGrpcController,
        PaymentEventConsumer,
        AddressValidationConsumer,
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
        SignatureService,
        RepairEventService,
        PaymentCommandService,
        AddressValidationPublisher,
        WScheduleService,
    ],
})
export class AppModule {}

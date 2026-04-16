import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { EventBusModule, MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { RepairEventService } from 'services/repair-event.service';
import { ScheduleEventService } from 'services/schedule-event.service';
import { PaymentCommandService } from 'modules/payment-command.service';
import { AddressValidationPublisher } from 'modules/address-validation.service';
import { AddressValidationConsumer } from 'consumers/address-validation.consumer';
import { UserDeviceValidationPublisher } from 'modules/user-device-validation.service';
import { UserDeviceValidationConsumer } from 'consumers/user-device-validation.consumer';
import {
    DeviceCategory,
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
    WSchedulePattern,
    WSchedulePatternHistory,
    UserStatusHistory,
    PaidPayment,
} from './entities';
import { DeviceGrpcController } from 'controllers/device.grpc.controller';
import { CertificateGrpcController } from 'controllers/certificate.grpc.controller';
import { RepairerGrpcController } from 'controllers/repairer.grpc.controller';
import { RepairGrpcController } from 'controllers/repair.grpc.controller';
import { DealerGrpcController } from 'controllers/dealer.grpc.controller';
import { ScheduleGrpcController } from 'controllers/schedule.grpc.controller';
import { SchedulePatternGrpcController } from 'controllers/schedule-pattern.grpc.controller';
import { PaymentEventConsumer } from 'consumers/payment-event.consumer';
import { ScheduleCommandConsumer } from 'consumers/schedule-command.consumer';
import { UserEventConsumer } from 'consumers/user-event.consumer';
import { DeviceService } from 'services/device.service';
import { AddressService } from 'services/address.service';
import { ExternalCertValidationService } from 'services/external-cert-validation.service';
import { CertificateService } from 'services/certificate.service';
import { CertificateExpiryService } from 'services/certificate-expiry.service';
import { RepairerService } from 'services/repairer.service';
import { ReviewService } from 'services/review.service';
import { RepairRequestService } from 'services/repair-request.service';
import { WorkStepService } from 'services/work-step.service';
import { DealerService } from 'services/dealer.service';
import { BrokenPartService } from 'services/broken-part.service';
import { SignatureService } from 'services/signature.service';
import { AvrPdfService } from 'services/avr-pdf.service';
import { CertificatePdfService } from 'services/certificate-pdf.service';
import { DeviceCategoryService } from 'services/device-category.service';
import { WScheduleService } from 'services/wschedule.service';
import { WSchedulePatternService } from 'services/wschedule-pattern.service';
import { WSchedulePatternHistoryService } from 'services/wschedule-pattern-history.service';
import { WScheduleReportService } from 'services/wschedule-report.service';
import { ScheduleEndSweepService } from 'services/schedule-end-sweep.service';
import { PaidPaymentService } from 'services/paid-payment.service';
import { SupplierService } from 'providers/supplier/supplier.service';
import { DummySupplierProvider } from 'providers/supplier/dummy-supplier.provider';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'repair-service' }),
        EventBusModule.forRoot(),
        ScheduleModule.forRoot(),
        DatabaseModule,
        MikroOrmModule.forFeature([
            DeviceCategory,
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
            WSchedulePattern,
            WSchedulePatternHistory,
            UserStatusHistory,
            PaidPayment,
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
            {
                name: 'USER_DEVICE_VALIDATION',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'user_device_validation_queue',
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
        SchedulePatternGrpcController,
        PaymentEventConsumer,
        AddressValidationConsumer,
        UserDeviceValidationConsumer,
        ScheduleCommandConsumer,
        UserEventConsumer,
    ],
    providers: [
        DeviceService,
        DeviceCategoryService,
        AddressService,
        ExternalCertValidationService,
        CertificateService,
        CertificateExpiryService,
        RepairerService,
        ReviewService,
        RepairRequestService,
        WorkStepService,
        BrokenPartService,
        DealerService,
        SignatureService,
        AvrPdfService,
        CertificatePdfService,
        RepairEventService,
        ScheduleEventService,
        PaymentCommandService,
        AddressValidationPublisher,
        UserDeviceValidationPublisher,
        WScheduleService,
        WSchedulePatternService,
        WSchedulePatternHistoryService,
        WScheduleReportService,
        ScheduleEndSweepService,
        PaidPaymentService,
        DummySupplierProvider,
        SupplierService,
    ],
})
export class AppModule {}

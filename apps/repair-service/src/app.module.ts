import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventBusModule, MetricsModule } from '@asko/observability';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';

// Domain modules
import { RmqClientsModule } from 'modules/rmq-clients.module';
import { SharedServicesModule } from 'modules/shared-services/shared-services.module';
import { WorkScheduleModule } from 'modules/schedule/schedule.module';
import { SupplierModule } from 'modules/supplier/supplier.module';
import { DeviceModule } from 'modules/device/device.module';
import { CertificateModule } from 'modules/certificate/certificate.module';
import { DealerModule } from 'modules/dealer/dealer.module';
import { RepairerModule } from 'modules/repairer/repairer.module';
import { RepairRequestModule } from 'modules/repair-request/repair-request.module';

// Cross-domain controllers & consumers
import { CertificateGrpcController } from 'modules/certificate/controllers/certificate.grpc.controller';
import { PaymentEventConsumer } from 'modules/repair-request/consumers/payment-event.consumer';
import { AddressValidationConsumer } from 'consumers/address-validation.consumer';
import { UserDeviceValidationConsumer } from 'consumers/user-device-validation.consumer';
import { UserEventConsumer } from 'consumers/user-event.consumer';

// Cross-domain services
import { ScheduleEndSweepService } from 'modules/schedule/services/schedule-end-sweep.service';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'repair-service' }),
        EventBusModule.forRoot(),
        ScheduleModule.forRoot(),
        DatabaseModule,
        RmqClientsModule,
        SharedServicesModule,
        WorkScheduleModule,
        SupplierModule,
        DeviceModule,
        CertificateModule,
        DealerModule,
        RepairerModule,
        RepairRequestModule,
    ],
    controllers: [
        CertificateGrpcController,
        PaymentEventConsumer,
        AddressValidationConsumer,
        UserDeviceValidationConsumer,
        UserEventConsumer,
    ],
    providers: [
        ScheduleEndSweepService,
    ],
})
export class AppModule {}

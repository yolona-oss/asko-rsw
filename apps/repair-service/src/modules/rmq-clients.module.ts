import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppConfig } from '../app.config';
import { RepairEventService } from 'services/repair-event.service';
import { ScheduleEventService } from 'modules/schedule/services/schedule-event.service';
import { PaymentCommandService } from 'modules/payment-command.service';
import { AddressValidationPublisher } from 'modules/address-validation.service';
import { UserDeviceValidationPublisher } from 'modules/user-device-validation.service';

@Global()
@Module({
    imports: [
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
    providers: [
        RepairEventService,
        ScheduleEventService,
        PaymentCommandService,
        AddressValidationPublisher,
        UserDeviceValidationPublisher,
    ],
    exports: [
        RepairEventService,
        ScheduleEventService,
        PaymentCommandService,
        AddressValidationPublisher,
        UserDeviceValidationPublisher,
    ],
})
export class RmqClientsModule {}

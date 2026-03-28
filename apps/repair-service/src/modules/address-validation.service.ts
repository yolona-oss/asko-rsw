import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface AddressValidationEvent {
    addressId: string;
    city: string;
    street: string;
    house: string;
    latitude?: number;
    longitude?: number;
    attempt: number;
}

@Injectable()
export class AddressValidationPublisher implements OnModuleInit {
    constructor(
        @Inject('ADDRESS_VALIDATION') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.rmqClient.connect();
        } catch (e) {
            console.error('[AddressValidation] Failed to connect to RabbitMQ, will retry on first emit:', e);
        }
    }

    async emit(event: AddressValidationEvent): Promise<void> {
        console.log(`[AddressValidation] Queued validation for address ${event.addressId}`);
        this.rmqClient.emit('address.validate', event);
    }
}

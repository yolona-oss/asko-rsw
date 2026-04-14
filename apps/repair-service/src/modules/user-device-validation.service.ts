import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface UserDeviceValidationEvent {
    userDeviceId: string;
    userId: string;
    deviceId: string;
    serialNumber: string;
    attempt: number;
}

@Injectable()
export class UserDeviceValidationPublisher implements OnModuleInit {
    constructor(
        @Inject('USER_DEVICE_VALIDATION') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.rmqClient.connect();
        } catch (e) {
            console.error('[UserDeviceValidation] Failed to connect to RabbitMQ, will retry on first emit:', e);
        }
    }

    async emit(event: UserDeviceValidationEvent): Promise<void> {
        console.log(`[UserDeviceValidation] Queued validation for device ${event.userDeviceId}`);
        this.rmqClient.emit('user-device.validate', event);
    }
}

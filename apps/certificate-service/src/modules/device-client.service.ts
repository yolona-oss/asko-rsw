import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import type { DeviceServiceClient, UserDeviceResponse, DevicePriceResponse } from '@asko/proto';

async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    return lastValueFrom(observable);
}

@Injectable()
export class DeviceClientService implements OnModuleInit {
    private deviceService!: DeviceServiceClient;

    constructor(@Inject('DEVICE_PACKAGE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.deviceService = this.client.getService<DeviceServiceClient>('DeviceService');
    }

    findUserDeviceById(id: string): Promise<UserDeviceResponse> {
        return grpcCall(this.deviceService.findUserDeviceById({ id }));
    }

    getDevicePrice(id: string): Promise<DevicePriceResponse> {
        return grpcCall(this.deviceService.getDevicePrice({ id }));
    }
}

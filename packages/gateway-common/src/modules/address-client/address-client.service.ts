import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '../../grpc';

import type {
    AddressServiceClient,
    AddressResponse,
    AddressListResponse,
    EmptyDeviceResponse,
} from '@asko/proto';

@Injectable()
export class AddressClientService implements OnModuleInit {
    private addressService!: AddressServiceClient;

    constructor(
        @Inject('ADDRESS_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.addressService = this.client.getService<AddressServiceClient>('AddressService');
    }

    createAddress(userId: string, dto: { city: string; district?: string; street: string; house: string; building?: string; apartment?: string; entrance?: string; floor?: string; intercom?: string; comment?: string; latitude?: number; longitude?: number }): Promise<AddressResponse> {
        return grpcCall(this.addressService.createAddress({
            userId,
            city: dto.city,
            district: dto.district ?? '',
            street: dto.street,
            house: dto.house,
            building: dto.building ?? '',
            apartment: dto.apartment ?? '',
            entrance: dto.entrance ?? '',
            floor: dto.floor ?? '',
            intercom: dto.intercom ?? '',
            comment: dto.comment ?? '',
            latitude: dto.latitude ?? 0,
            longitude: dto.longitude ?? 0,
        }));
    }

    updateAddress(userId: string, id: string, dto: { city?: string; district?: string; street?: string; house?: string; building?: string; apartment?: string; entrance?: string; floor?: string; intercom?: string; comment?: string; latitude?: number; longitude?: number }): Promise<AddressResponse> {
        return grpcCall(this.addressService.updateAddress({
            userId,
            id,
            city: dto.city ?? '',
            district: dto.district ?? '',
            street: dto.street ?? '',
            house: dto.house ?? '',
            building: dto.building ?? '',
            apartment: dto.apartment ?? '',
            entrance: dto.entrance ?? '',
            floor: dto.floor ?? '',
            intercom: dto.intercom ?? '',
            comment: dto.comment ?? '',
            latitude: dto.latitude ?? 0,
            longitude: dto.longitude ?? 0,
        }));
    }

    deleteAddress(userId: string, id: string): Promise<EmptyDeviceResponse> {
        return grpcCall(this.addressService.deleteAddress({ userId, id }));
    }

    setPrimaryAddress(userId: string, id: string): Promise<AddressResponse> {
        return grpcCall(this.addressService.setPrimaryAddress({ userId, id }));
    }

    findAddressById(id: string): Promise<AddressResponse> {
        return grpcCall(this.addressService.findAddressById({ id }));
    }

    findUserAddresses(userId: string): Promise<AddressListResponse> {
        return grpcCall(this.addressService.findUserAddresses({ userId }));
    }
}

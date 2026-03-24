import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    DeviceServiceClient,
    DeviceResponse,
    UserDeviceResponse,
    UserDeviceListResponse,
    AddressResponse,
    AddressListResponse,
    PaginatedDevicesResponse,
    DevicePriceResponse,
    ImportDevicesResponse,
    DeleteAllResponse,
    DevicePartResponse,
    DevicePartListResponse,
} from '@asko/proto';

@Injectable()
export class DeviceClientService implements OnModuleInit {
    private deviceService!: DeviceServiceClient;

    constructor(
        @Inject('DEVICE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.deviceService = this.client.getService<DeviceServiceClient>('DeviceService');
    }

    // ── Device catalog (admin) ──

    createDevice(dto: { name: string; type: string; model: string; brand: string; description?: string; specifications?: Record<string, any>; features?: Record<string, any> }): Promise<DeviceResponse> {
        return grpcCall(this.deviceService.createDevice({
            name: dto.name,
            type: dto.type,
            model: dto.model,
            brand: dto.brand,
            description: dto.description ?? '',
            specifications: dto.specifications ? JSON.stringify(dto.specifications) : '',
            features: dto.features ? JSON.stringify(dto.features) : '',
        }));
    }

    updateDevice(id: string, dto: Record<string, any>): Promise<DeviceResponse> {
        return grpcCall(this.deviceService.updateDevice({
            id,
            name: dto.name ?? '',
            type: dto.type ?? '',
            model: dto.model ?? '',
            brand: dto.brand ?? '',
            price: dto.price ?? 0,
            description: dto.description ?? '',
            specifications: dto.specifications ? JSON.stringify(dto.specifications) : '',
            features: dto.features ? JSON.stringify(dto.features) : '',
            slug: dto.slug ?? '',
            isFeatured: dto.isFeatured ?? false,
        }));
    }

    deleteDevice(id: string): Promise<void> {
        return grpcCall(this.deviceService.deleteDevice({ id })).then(() => undefined);
    }

    deleteAllDevices(): Promise<DeleteAllResponse> {
        return grpcCall(this.deviceService.deleteAllDevices({}));
    }

    importDevices(products: Record<string, any>[]): Promise<ImportDevicesResponse> {
        return grpcCall(this.deviceService.importDevices({
            productsJson: JSON.stringify(products),
        }));
    }

    // ── Device catalog (public) ──

    findAllDevices(pagination: { offset?: number; limit?: number; search?: string }): Promise<PaginatedDevicesResponse> {
        return grpcCall(this.deviceService.findAllDevices({
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
        }));
    }

    findDeviceBySlug(slug: string): Promise<DeviceResponse> {
        return grpcCall(this.deviceService.findDeviceBySlug({ slug }));
    }

    findDeviceById(id: string): Promise<DeviceResponse> {
        return grpcCall(this.deviceService.findDeviceById({ id }));
    }

    getDevicePrice(id: string): Promise<DevicePriceResponse> {
        return grpcCall(this.deviceService.getDevicePrice({ id }));
    }

    // ── User devices ──

    registerUserDevice(userId: string, dto: { deviceId: string; serialNumber: string; addressId: string; purchaseDate?: string; warrantyUntil?: string; notes?: string }): Promise<UserDeviceResponse> {
        return grpcCall(this.deviceService.registerUserDevice({
            userId,
            deviceId: dto.deviceId,
            serialNumber: dto.serialNumber,
            addressId: dto.addressId,
            purchaseDate: dto.purchaseDate ?? '',
            warrantyUntil: dto.warrantyUntil ?? '',
            notes: dto.notes ?? '',
        }));
    }

    getUserDevices(userId: string): Promise<UserDeviceListResponse> {
        return grpcCall(this.deviceService.getUserDevices({ userId }));
    }

    getUserDevice(userId: string, id: string): Promise<UserDeviceResponse> {
        return grpcCall(this.deviceService.getUserDevice({ userId, id }));
    }

    removeUserDevice(userId: string, id: string): Promise<void> {
        return grpcCall(this.deviceService.removeUserDevice({ userId, id })).then(() => undefined);
    }

    findUserDeviceById(id: string): Promise<UserDeviceResponse> {
        return grpcCall(this.deviceService.findUserDeviceById({ id }));
    }

    // ── Device parts ──

    createDevicePart(deviceId: string, dto: { name: string; partNumber?: string; price?: number; description?: string }): Promise<DevicePartResponse> {
        return grpcCall(this.deviceService.createDevicePart({
            deviceId,
            name: dto.name,
            partNumber: dto.partNumber ?? '',
            price: dto.price ?? 0,
            description: dto.description ?? '',
        }));
    }

    updateDevicePart(partId: string, dto: { name?: string; partNumber?: string; price?: number; description?: string }): Promise<DevicePartResponse> {
        return grpcCall(this.deviceService.updateDevicePart({
            id: partId,
            name: dto.name ?? '',
            partNumber: dto.partNumber ?? '',
            price: dto.price ?? 0,
            description: dto.description ?? '',
        }));
    }

    deleteDevicePart(partId: string): Promise<void> {
        return grpcCall(this.deviceService.deleteDevicePart({ id: partId })).then(() => undefined);
    }

    getDeviceParts(deviceId: string): Promise<DevicePartListResponse> {
        return grpcCall(this.deviceService.getDeviceParts({ deviceId }));
    }

    // ── Address ──

    createAddress(dto: { country: string; city: string; street: string; house: number; building?: number; floor?: number; room?: number; postalCode?: string }): Promise<AddressResponse> {
        return grpcCall(this.deviceService.createAddress({
            country: dto.country,
            city: dto.city,
            street: dto.street,
            house: dto.house,
            building: dto.building ?? 0,
            floor: dto.floor ?? 0,
            room: dto.room ?? 0,
            postalCode: dto.postalCode ?? '',
        }));
    }

    findAddressById(id: string): Promise<AddressResponse> {
        return grpcCall(this.deviceService.findAddressById({ id }));
    }

    findAllAddresses(): Promise<AddressListResponse> {
        return grpcCall(this.deviceService.findAllAddresses({}));
    }
}

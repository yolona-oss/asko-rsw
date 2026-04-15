import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

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
    ImportDevicePartsResponse,
    DeleteAllResponse,
    DevicePartResponse,
    DevicePartListResponse,
    PaginatedDevicePartsResponse,
    DeviceCategoryResponse,
    DeviceCategoryListResponse,
    EmptyDeviceResponse,
} from '@asko/proto';

@Injectable()
export class DeviceClientService implements OnModuleInit {
    private deviceService!: DeviceServiceClient;

    constructor(
        @Inject('REPAIR_PACKAGE') private readonly client: ClientGrpc,
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

    findAllDevices(pagination: { page?: number; limit?: number; search?: string; type?: string; isFeatured?: boolean; sortBy?: string; sortOrder?: string }): Promise<PaginatedDevicesResponse> {
        return grpcCall(this.deviceService.findAllDevices({
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
            type: pagination.type ?? '',
            isFeatured: pagination.isFeatured ?? false,
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
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

    updateUserDevice(userId: string, id: string, dto: { addressId?: string; serialNumber?: string; notes?: string }): Promise<UserDeviceResponse> {
        return grpcCall(this.deviceService.updateUserDevice({
            userId,
            id,
            addressId: dto.addressId ?? '',
            serialNumber: dto.serialNumber ?? '',
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

    createDevicePart(deviceId: string | undefined, dto: { name: string; partNumber?: string; price?: number; description?: string; group?: string; categoryId?: string }): Promise<DevicePartResponse> {
        return grpcCall(this.deviceService.createDevicePart({
            deviceId: deviceId ?? '',
            name: dto.name,
            partNumber: dto.partNumber ?? '',
            price: dto.price ?? 0,
            description: dto.description ?? '',
            group: dto.group ?? '',
            categoryId: dto.categoryId ?? '',
        }));
    }

    updateDevicePart(partId: string, dto: { name?: string; partNumber?: string; price?: number; description?: string; deviceId?: string; group?: string; categoryId?: string }): Promise<DevicePartResponse> {
        return grpcCall(this.deviceService.updateDevicePart({
            id: partId,
            name: dto.name ?? '',
            partNumber: dto.partNumber ?? '',
            price: dto.price ?? 0,
            description: dto.description ?? '',
            deviceId: dto.deviceId ?? '',
            group: dto.group ?? '',
            categoryId: dto.categoryId ?? '',
        }));
    }

    deleteDevicePart(partId: string): Promise<void> {
        return grpcCall(this.deviceService.deleteDevicePart({ id: partId })).then(() => undefined);
    }

    getDeviceParts(deviceId: string): Promise<DevicePartListResponse> {
        return grpcCall(this.deviceService.getDeviceParts({ deviceId }));
    }

    importDeviceParts(parts: Record<string, any>[]): Promise<ImportDevicePartsResponse> {
        return grpcCall(this.deviceService.importDeviceParts({
            partsJson: JSON.stringify(parts),
        }));
    }

    getAllDeviceParts(params: { page?: number; limit?: number; search?: string; deviceId?: string; genericOnly?: boolean; categoryId?: string }): Promise<PaginatedDevicePartsResponse> {
        return grpcCall(this.deviceService.getAllDeviceParts({
            page: params.page ?? 1,
            limit: params.limit ?? 50,
            search: params.search ?? '',
            deviceId: params.deviceId ?? '',
            genericOnly: params.genericOnly ?? false,
            categoryId: params.categoryId ?? '',
        }));
    }

    // ── Address ──

    createAddress(userId: string, dto: { city: string; district?: string; street: string; house: string; building?: string; apartment?: string; entrance?: string; floor?: string; intercom?: string; comment?: string; latitude?: number; longitude?: number }): Promise<AddressResponse> {
        return grpcCall(this.deviceService.createAddress({
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
        return grpcCall(this.deviceService.updateAddress({
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
        return grpcCall(this.deviceService.deleteAddress({ userId, id }));
    }

    setPrimaryAddress(userId: string, id: string): Promise<AddressResponse> {
        return grpcCall(this.deviceService.setPrimaryAddress({ userId, id }));
    }

    findAddressById(id: string): Promise<AddressResponse> {
        return grpcCall(this.deviceService.findAddressById({ id }));
    }

    findUserAddresses(userId: string): Promise<AddressListResponse> {
        return grpcCall(this.deviceService.findUserAddresses({ userId }));
    }

    // ── Device categories ──

    findAllDeviceCategories(): Promise<DeviceCategoryListResponse> {
        return grpcCall(this.deviceService.findAllDeviceCategories({}));
    }

    findDeviceCategoryById(id: string): Promise<DeviceCategoryResponse> {
        return grpcCall(this.deviceService.findDeviceCategoryById({ id }));
    }

    createDeviceCategory(name: string, label: string, labelPlural: string, order?: number): Promise<DeviceCategoryResponse> {
        return grpcCall(this.deviceService.createDeviceCategory({
            name, label, labelPlural, order: order ?? 0,
        }));
    }

    updateDeviceCategory(id: string, name?: string, label?: string, labelPlural?: string, order?: number): Promise<DeviceCategoryResponse> {
        return grpcCall(this.deviceService.updateDeviceCategory({
            id,
            name: name ?? '',
            label: label ?? '',
            labelPlural: labelPlural ?? '',
            order: order ?? 0,
        }));
    }

    deleteDeviceCategory(id: string): Promise<EmptyDeviceResponse> {
        return grpcCall(this.deviceService.deleteDeviceCategory({ id }));
    }
}

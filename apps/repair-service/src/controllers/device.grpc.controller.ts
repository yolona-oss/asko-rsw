import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { DeviceService } from 'services/device.service';
import { AddressService } from 'services/address.service';
import { AppError } from 'common/error';
import type { Device } from 'entities/device.entity';
import type { UserDevice } from 'entities/user-device.entity';
import type { Address } from 'entities/address.entity';

import type { DevicePart } from 'entities/device-part.entity';

import type {
    CreateDeviceRequest,
    UpdateDeviceRequest,
    DeleteDeviceRequest,
    ImportDevicesRequest,
    FindAllDevicesRequest,
    FindBySlugRequest,
    FindByIdRequest,
    RegisterUserDeviceRequest,
    GetUserDevicesRequest,
    GetUserDeviceRequest,
    RemoveUserDeviceRequest,
    CreateAddressRequest,
    CreateDevicePartRequest,
    UpdateDevicePartRequest,
    DeleteDevicePartRequest,
    GetDevicePartsRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 400: grpcCode = status.INVALID_ARGUMENT; break;
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
}

function deviceToRecord(entity: Device) {
    return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        model: entity.model,
        brand: entity.brand,
        price: entity.price ?? 0,
        description: entity.description ?? '',
        specifications: entity.specifications ? JSON.stringify(entity.specifications) : '',
        features: entity.features ? JSON.stringify(entity.features) : '',
        slug: entity.slug,
        isFeatured: entity.isFeatured ?? false,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function addressToRecord(entity: Address) {
    return {
        id: entity.id,
        country: '',
        city: entity.city,
        street: entity.street,
        house: parseInt(entity.house) || 0,
        building: 0,
        floor: parseInt(entity.floor ?? '') || 0,
        room: parseInt(entity.apartment ?? '') || 0,
        postalCode: '',
        latitude: entity.latitude ?? 0,
        longitude: entity.longitude ?? 0,
    };
}

function devicePartToRecord(entity: DevicePart) {
    return {
        id: entity.id,
        deviceId: typeof entity.device === 'object' ? entity.device.id : String(entity.device),
        name: entity.name,
        partNumber: entity.partNumber ?? '',
        price: entity.price ?? 0,
        description: entity.description ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function userDeviceToRecord(entity: UserDevice) {
    const device = typeof entity.device === 'object' ? entity.device : null;
    const address = typeof entity.address === 'object' ? entity.address : null;

    return {
        id: entity.id,
        userId: entity.userId,
        deviceId: device?.id ?? '',
        serialNumber: entity.serialNumber,
        addressId: address?.id ?? '',
        purchaseDate: entity.purchaseDate?.toISOString() ?? '',
        warrantyUntil: entity.warrantyUntil?.toISOString() ?? '',
        notes: entity.notes ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        registrationSignature: entity.registrationSignature ?? '',
        registrationSignedPayload: entity.registrationSignedPayload ?? '',
        device: device ? deviceToRecord(device) : undefined,
        address: address ? addressToRecord(address) : undefined,
    };
}

@Controller()
export class DeviceGrpcController {
    constructor(
        private readonly deviceService: DeviceService,
        private readonly addressService: AddressService,
    ) {}

    // ── Device catalog (admin) ──

    @GrpcMethod('DeviceService', 'CreateDevice')
    async createDevice(data: CreateDeviceRequest) {
        try {
            const device = await this.deviceService.createDevice({
                name: data.name,
                type: data.type,
                model: data.model,
                brand: data.brand,
                description: data.description || undefined,
                specifications: data.specifications ? JSON.parse(data.specifications) : undefined,
                features: data.features ? JSON.parse(data.features) : undefined,
            });
            return { device: deviceToRecord(device) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'UpdateDevice')
    async updateDevice(data: UpdateDeviceRequest) {
        try {
            const device = await this.deviceService.updateDevice(data.id, {
                name: data.name || undefined,
                type: data.type || undefined,
                model: data.model || undefined,
                brand: data.brand || undefined,
                price: data.price || undefined,
                description: data.description || undefined,
                specifications: data.specifications ? JSON.parse(data.specifications) : undefined,
                features: data.features ? JSON.parse(data.features) : undefined,
                slug: data.slug || undefined,
                isFeatured: data.isFeatured,
            });
            return { device: deviceToRecord(device) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'DeleteDevice')
    async deleteDevice(data: DeleteDeviceRequest) {
        try {
            await this.deviceService.deleteDevice(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'DeleteAllDevices')
    async deleteAllDevices() {
        try {
            const result = await this.deviceService.deleteAllDevices();
            return { deletedCount: result.deletedCount };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'ImportDevices')
    async importDevices(data: ImportDevicesRequest) {
        try {
            const products = JSON.parse(data.productsJson);
            const result = await this.deviceService.importDevices(products);
            return { importedCount: result.imported };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Device catalog (public) ──

    @GrpcMethod('DeviceService', 'FindAllDevices')
    async findAllDevices(data: FindAllDevicesRequest) {
        try {
            const result = await this.deviceService.findAll({
                offset: data.offset,
                limit: data.limit,
                search: data.search || undefined,
            });
            return {
                data: result.data.map(deviceToRecord),
                overallCount: result.total,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'FindDeviceBySlug')
    async findDeviceBySlug(data: FindBySlugRequest) {
        try {
            const device = await this.deviceService.findBySlug(data.slug);
            return { device: deviceToRecord(device) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'FindDeviceById')
    async findDeviceById(data: FindByIdRequest) {
        try {
            const device = await this.deviceService.findById(data.id);
            return { device: deviceToRecord(device) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'GetDevicePrice')
    async getDevicePrice(data: FindByIdRequest) {
        try {
            const device = await this.deviceService.findById(data.id);
            return { price: device.price ?? 0 };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── User devices ──

    @GrpcMethod('DeviceService', 'RegisterUserDevice')
    async registerUserDevice(data: RegisterUserDeviceRequest) {
        try {
            const userDevice = await this.deviceService.registerUserDevice(data.userId, {
                deviceId: data.deviceId,
                serialNumber: data.serialNumber,
                addressId: data.addressId,
                purchaseDate: data.purchaseDate || undefined,
                warrantyUntil: data.warrantyUntil || undefined,
                notes: data.notes || undefined,
            });
            return { userDevice: userDeviceToRecord(userDevice) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'GetUserDevices')
    async getUserDevices(data: GetUserDevicesRequest) {
        try {
            const devices = await this.deviceService.getUserDevices(data.userId);
            return { userDevices: devices.map(userDeviceToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'GetUserDevice')
    async getUserDevice(data: GetUserDeviceRequest) {
        try {
            const userDevice = await this.deviceService.getUserDevice(data.userId, data.id);
            return { userDevice: userDeviceToRecord(userDevice) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'RemoveUserDevice')
    async removeUserDevice(data: RemoveUserDeviceRequest) {
        try {
            await this.deviceService.removeUserDevice(data.userId, data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'FindUserDeviceById')
    async findUserDeviceById(data: FindByIdRequest) {
        try {
            const userDevice = await this.deviceService.findUserDeviceById(data.id);
            return { userDevice: userDeviceToRecord(userDevice) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Device parts ──

    @GrpcMethod('DeviceService', 'CreateDevicePart')
    async createDevicePart(data: CreateDevicePartRequest) {
        try {
            const part = await this.deviceService.createDevicePart(data.deviceId, {
                name: data.name,
                partNumber: data.partNumber || undefined,
                price: data.price || undefined,
                description: data.description || undefined,
            });
            return { part: devicePartToRecord(part) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'UpdateDevicePart')
    async updateDevicePart(data: UpdateDevicePartRequest) {
        try {
            const part = await this.deviceService.updateDevicePart(data.id, {
                name: data.name || undefined,
                partNumber: data.partNumber,
                price: data.price,
                description: data.description,
            });
            return { part: devicePartToRecord(part) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'DeleteDevicePart')
    async deleteDevicePart(data: DeleteDevicePartRequest) {
        try {
            await this.deviceService.deleteDevicePart(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'GetDeviceParts')
    async getDeviceParts(data: GetDevicePartsRequest) {
        try {
            const parts = await this.deviceService.getDeviceParts(data.deviceId);
            return { parts: parts.map(devicePartToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Address ──

    @GrpcMethod('DeviceService', 'CreateAddress')
    async createAddress(data: CreateAddressRequest) {
        try {
            // Map proto CreateAddressRequest to AddressService.create
            const address = await this.addressService.create('', {
                city: data.city,
                street: data.street,
                house: String(data.house),
                floor: data.floor ? String(data.floor) : undefined,
                apartment: data.room ? String(data.room) : undefined,
                latitude: data.latitude || undefined,
                longitude: data.longitude || undefined,
            });
            return { address: addressToRecord(address) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'FindAddressById')
    async findAddressById(data: FindByIdRequest) {
        try {
            const address = await this.addressService.findById(data.id);
            return { address: addressToRecord(address) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'FindAllAddresses')
    async findAllAddresses() {
        try {
            const addresses = await this.addressService.findAll('');
            return { addresses: addresses.map(addressToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { DeviceService } from 'services/device.service';
import { AddressService } from 'services/address.service';
import { AppError } from 'common/error';
import { DeviceType } from '@asko/shared';
import type { Device } from 'entities/device.entity';
import type { UserDevice } from 'entities/user-device.entity';
import type { Address } from 'entities/address.entity';

// Import request types from proto interfaces
import type {
    CreateDeviceRequest,
    UpdateDeviceRequest,
    FindByIdRequest,
    FindBySlugRequest,
    FindAllDevicesRequest,
    RegisterUserDeviceRequest,
    GetUserDevicesRequest,
    GetUserDeviceRequest,
    RemoveUserDeviceRequest,
    ImportDevicesRequest,
    CreateAddressRequest,
    DeleteDeviceRequest,
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

function addressToRecord(entity: Address) {
    return {
        id: entity.id,
        country: entity.country,
        city: entity.city,
        street: entity.street,
        house: entity.house,
        building: entity.building ?? 0,
        floor: entity.floor ?? 0,
        room: entity.room ?? 0,
        postalCode: entity.postalCode ?? '',
    };
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

function userDeviceToRecord(entity: UserDevice) {
    return {
        id: entity.id,
        userId: entity.userId,
        deviceId: typeof entity.device === 'object' ? entity.device.id : String(entity.device),
        serialNumber: entity.serialNumber,
        addressId: typeof entity.address === 'object' ? entity.address.id : String(entity.address),
        purchaseDate: entity.purchaseDate?.toISOString() ?? '',
        warrantyUntil: entity.warrantyUntil?.toISOString() ?? '',
        notes: entity.notes ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        device: typeof entity.device === 'object' ? deviceToRecord(entity.device) : undefined,
        address: typeof entity.address === 'object' ? addressToRecord(entity.address) : undefined,
    };
}

@Controller()
export class DeviceGrpcController {
    constructor(
        private readonly deviceService: DeviceService,
        private readonly addressService: AddressService,
    ) {}

    // ── Device catalog ──

    @GrpcMethod('DeviceService', 'CreateDevice')
    async createDevice(data: CreateDeviceRequest) {
        try {
            const device = await this.deviceService.createDevice({
                name: data.name,
                type: data.type as DeviceType,
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
            const dto: Record<string, any> = {};
            if (data.name) dto.name = data.name;
            if (data.type) dto.type = data.type;
            if (data.model) dto.model = data.model;
            if (data.brand) dto.brand = data.brand;
            if (data.description) dto.description = data.description;
            if (data.specifications) dto.specifications = JSON.parse(data.specifications);
            if (data.features) dto.features = JSON.parse(data.features);
            if (data.price) dto.price = data.price;
            const device = await this.deviceService.updateDevice(data.id, dto);
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
            const count = await this.deviceService.deleteAllDevices();
            return { count };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'ImportDevices')
    async importDevices(data: ImportDevicesRequest) {
        try {
            return await this.deviceService.importDevices(data.productsJson);
        } catch (e) { throw toGrpcError(e); }
    }

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

    // ── Address ──

    @GrpcMethod('DeviceService', 'CreateAddress')
    async createAddress(data: CreateAddressRequest) {
        try {
            const address = await this.addressService.create({
                country: data.country,
                city: data.city,
                street: data.street,
                house: data.house,
                building: data.building || undefined,
                floor: data.floor || undefined,
                room: data.room || undefined,
                postalCode: data.postalCode || undefined,
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
            const addresses = await this.addressService.findAll();
            return { addresses: addresses.map(addressToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }
}

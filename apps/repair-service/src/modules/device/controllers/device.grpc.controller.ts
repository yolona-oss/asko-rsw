import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { appErrorToGrpcPayload } from '@asko/shared';
import { DeviceService } from 'modules/device/services/device.service';
import { DeviceCategoryService } from 'modules/device/services/device-category.service';
import type { Device } from 'modules/device/entities/device.entity';
import type { DeviceCategory } from 'modules/device/entities/device-category.entity';
import type { UserDevice } from 'modules/device/entities/user-device.entity';
import type { Address } from 'modules/device/entities/address.entity';

import type { DevicePart } from 'modules/device/entities/device-part.entity';

import type {
    CreateDeviceRequest,
    UpdateDeviceRequest,
    DeleteDeviceRequest,
    ImportDevicesRequest,
    FindAllDevicesRequest,
    FindBySlugRequest,
    FindByIdRequest,
    RegisterUserDeviceRequest,
    UpdateUserDeviceRequest,
    GetUserDevicesRequest,
    GetUserDeviceRequest,
    RemoveUserDeviceRequest,
    CreateDevicePartRequest,
    UpdateDevicePartRequest,
    DeleteDevicePartRequest,
    GetDevicePartsRequest,
    GetAllDevicePartsRequest,
    CreateDeviceCategoryRequest,
    UpdateDeviceCategoryRequest,
    DeleteDeviceCategoryRequest,
    ImportDevicePartsRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    return new RpcException(appErrorToGrpcPayload(error));
}

function deviceToRecord(entity: Device) {
    return {
        id: entity.id,
        name: entity.name,
        type: entity.category?.name ?? '',
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
        categoryId: entity.category?.id ?? '',
        categoryName: entity.category?.name ?? '',
        categoryLabel: entity.category?.label ?? '',
    };
}

function categoryToRecord(entity: DeviceCategory) {
    return {
        id: entity.id,
        name: entity.name,
        label: entity.label,
        labelPlural: entity.labelPlural,
        order: entity.order,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function addressToRecord(entity: Address) {
    return {
        id: entity.id,
        city: entity.city,
        district: entity.district ?? '',
        street: entity.street,
        house: entity.house,
        building: entity.building ?? '',
        apartment: entity.apartment ?? '',
        entrance: entity.entrance ?? '',
        floor: entity.floor ?? '',
        intercom: entity.intercom ?? '',
        comment: entity.comment ?? '',
        latitude: entity.latitude ?? 0,
        longitude: entity.longitude ?? 0,
        validationStatus: entity.validationStatus ?? 'pending',
        validationError: entity.validationError ?? '',
        isPrimary: entity.isPrimary ?? false,
    };
}

function devicePartToRecord(entity: DevicePart) {
    const device = entity.device && typeof entity.device === 'object' ? entity.device : null;
    const category = entity.category && typeof entity.category === 'object' ? entity.category : null;
    return {
        id: entity.id,
        deviceId: device ? device.id : (entity.device ? String(entity.device) : ''),
        name: entity.name,
        partNumber: entity.partNumber ?? '',
        price: entity.price ?? 0,
        description: entity.description ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
        deviceName: device?.name ?? '',
        group: entity.group ?? '',
        categoryId: category ? category.id : (entity.category ? String(entity.category) : ''),
        categoryName: category?.label ?? '',
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
        validationStatus: entity.validationStatus ?? 'pending',
        validationError: entity.validationError ?? '',
        device: device ? deviceToRecord(device) : undefined,
        address: address ? addressToRecord(address) : undefined,
    };
}

@Controller()
export class DeviceGrpcController {
    constructor(
        private readonly deviceService: DeviceService,
        private readonly deviceCategoryService: DeviceCategoryService,
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
            return {
                importedCount: result.imported,
                imported: result.importedDevices.map((d) => ({
                    id: d.id,
                    imageUrls: d.imageUrls,
                })),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Device catalog (public) ──

    @GrpcMethod('DeviceService', 'FindAllDevices')
    async findAllDevices(data: FindAllDevicesRequest) {
        try {
            const result = await this.deviceService.findAll({
                page: data.page,
                limit: data.limit,
                search: data.search || undefined,
                type: data.type || undefined,
                isFeatured: data.isFeatured || undefined,
            });
            return {
                data: result.data.map(deviceToRecord),
                overallCount: result.total,
                page: data.page,
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

    @GrpcMethod('DeviceService', 'UpdateUserDevice')
    async updateUserDevice(data: UpdateUserDeviceRequest) {
        try {
            const userDevice = await this.deviceService.updateUserDevice(data.userId, data.id, {
                addressId: data.addressId || undefined,
                serialNumber: data.serialNumber || undefined,
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
            const part = await this.deviceService.createDevicePart(data.deviceId || undefined, {
                name: data.name,
                partNumber: data.partNumber || undefined,
                price: data.price || undefined,
                description: data.description || undefined,
                group: data.group || undefined,
                categoryId: data.categoryId || undefined,
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
                deviceId: data.deviceId,
                group: data.group,
                categoryId: data.categoryId,
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

    @GrpcMethod('DeviceService', 'ImportDeviceParts')
    async importDeviceParts(data: ImportDevicePartsRequest) {
        try {
            const parts = JSON.parse(data.partsJson);
            const result = await this.deviceService.importDeviceParts(parts);
            return {
                importedCount: result.imported,
                skippedCount: result.skipped,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'GetAllDeviceParts')
    async getAllDeviceParts(data: GetAllDevicePartsRequest) {
        try {
            const { data: parts, total } = await this.deviceService.getAllDeviceParts({
                page: data.page || 1,
                limit: data.limit || 50,
                search: data.search || undefined,
                deviceId: data.deviceId || undefined,
                genericOnly: data.genericOnly || false,
                categoryId: data.categoryId || undefined,
            });
            return {
                parts: parts.map(devicePartToRecord),
                overallCount: total,
                page: data.page || 1,
                limit: data.limit || 50,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Device categories ──

    @GrpcMethod('DeviceService', 'FindAllDeviceCategories')
    async findAllDeviceCategories() {
        try {
            const categories = await this.deviceCategoryService.findAll();
            return { categories: categories.map(categoryToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'FindDeviceCategoryById')
    async findDeviceCategoryById(data: { id: string }) {
        try {
            const category = await this.deviceCategoryService.findById(data.id);
            return { category: categoryToRecord(category) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'CreateDeviceCategory')
    async createDeviceCategory(data: CreateDeviceCategoryRequest) {
        try {
            const category = await this.deviceCategoryService.create({
                name: data.name,
                label: data.label,
                labelPlural: data.labelPlural,
                order: data.order || 0,
            });
            return { category: categoryToRecord(category) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'UpdateDeviceCategory')
    async updateDeviceCategory(data: UpdateDeviceCategoryRequest) {
        try {
            const dto: Record<string, any> = {};
            if (data.name) dto.name = data.name;
            if (data.label) dto.label = data.label;
            if (data.labelPlural) dto.labelPlural = data.labelPlural;
            if (data.order) dto.order = data.order;
            const category = await this.deviceCategoryService.update(data.id, dto);
            return { category: categoryToRecord(category) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DeviceService', 'DeleteDeviceCategory')
    async deleteDeviceCategory(data: DeleteDeviceCategoryRequest) {
        try {
            await this.deviceCategoryService.delete(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }
}

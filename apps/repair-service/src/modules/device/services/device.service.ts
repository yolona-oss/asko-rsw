import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Device, DeviceCategory, UserDevice, Address, DevicePart } from 'entities';
import { AppErrors } from 'common/error';
import { assertAddressValid } from 'common/address-validation.guard';
import { slugify } from '@asko/shared';
import { resolveTimezone } from 'common/timezone-lookup';
import { SignatureService } from 'modules/shared-services/services/signature.service';
import { UserDeviceValidationPublisher } from 'modules/user-device-validation.service';
import { AddressValidationPublisher } from 'modules/address-validation.service';

const DEVICE_SORTABLE_FIELDS = ['createdAt', 'name', 'brand', 'model', 'isFeatured'] as const;

@Injectable()
export class DeviceService {
    constructor(
        private readonly em: EntityManager,
        private readonly signatureService: SignatureService,
        private readonly deviceValidationPublisher: UserDeviceValidationPublisher,
        private readonly addressValidationPublisher: AddressValidationPublisher,
    ) {}

    /** Clone an address for a user and trigger validation. */
    private async cloneAddressForUser(source: Address, userId: string): Promise<Address> {
        const existing = await this.em.count(Address, { userId });
        const clone = this.em.create(Address, {
            userId,
            city: source.city,
            district: source.district,
            street: source.street,
            house: source.house,
            building: source.building,
            apartment: source.apartment,
            entrance: source.entrance,
            floor: source.floor,
            intercom: source.intercom,
            comment: source.comment,
            latitude: source.latitude,
            longitude: source.longitude,
            timezone: resolveTimezone(source.city, source.longitude),
            isPrimary: existing === 0,
        });
        await this.em.persistAndFlush(clone);

        this.addressValidationPublisher.emit({
            addressId: clone.id,
            city: clone.city,
            street: clone.street,
            house: clone.house,
            latitude: clone.latitude,
            longitude: clone.longitude,
            attempt: 0,
        }).catch((e) => console.error('[DeviceService] Failed to queue address validation:', e));

        return clone;
    }

    // ── Device catalog (admin) ──────────────────────────────────────────

    @CreateRequestContext()
    async createDevice(dto: {
        name: string;
        type: string;
        model: string;
        brand: string;
        price?: number;
        description?: string;
        specifications?: Record<string, any>;
        features?: Record<string, any>;
        isFeatured?: boolean;
    }): Promise<Device> {
        const slug = slugify(`${dto.brand}-${dto.model}-${dto.name}`);

        // Check slug uniqueness
        const existing = await this.em.findOne(Device, { slug });
        const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

        const category = await this.em.findOne(DeviceCategory, { name: dto.type });
        if (!category) throw AppErrors.badRequest(`Unknown device category: ${dto.type}`);

        const device = this.em.create(Device, {
            name: dto.name,
            category,
            model: dto.model,
            brand: dto.brand,
            price: dto.price,
            description: dto.description,
            specifications: dto.specifications,
            features: dto.features,
            slug: finalSlug,
            isFeatured: dto.isFeatured ?? false,
        });
        await this.em.persistAndFlush(device);
        return device;
    }

    @CreateRequestContext()
    async importDevices(products: Record<string, any>[]): Promise<{ imported: number; skipped: number; importedDevices: { id: string; imageUrls: string[] }[] }> {
        let imported = 0;
        let skipped = 0;
        const importedDevices: { id: string; imageUrls: string[] }[] = [];

        for (const product of products) {
            try {
                const slug = slugify(`${product.brand ?? ''}-${product.model ?? ''}-${product.name ?? ''}`);
                const existing = await this.em.findOne(Device, { slug });
                if (existing) {
                    skipped++;
                    continue;
                }

                const category = await this.em.findOne(DeviceCategory, { name: product.type ?? 'other' })
                    ?? await this.em.findOne(DeviceCategory, { name: 'other' });
                if (!category) { skipped++; continue; }

                // Extract nested fields from scraped data format
                const rawSpecs = product.specifications ?? {};
                const specifications = rawSpecs.technical ?? (typeof rawSpecs === 'object' && !rawSpecs.technical ? rawSpecs : undefined);
                const features = rawSpecs.features ?? product.features ?? undefined;
                const parsedPrice = product.price ?? (rawSpecs.price ? parseFloat(rawSpecs.price) : null);
                const price = parsedPrice || Math.floor(Math.random() * 190001) + 10000;
                const imageUrls: string[] = (rawSpecs.images ?? []).filter((u: string) => typeof u === 'string' && !u.endsWith('.webm'));

                const device = this.em.create(Device, {
                    name: product.name ?? '',
                    category,
                    model: product.model ?? '',
                    brand: product.brand ?? '',
                    price: price || undefined,
                    description: product.description ?? undefined,
                    specifications,
                    features,
                    slug,
                    isFeatured: product.isFeatured ?? false,
                });
                this.em.persist(device);
                importedDevices.push({ id: device.id, imageUrls });
                imported++;
            } catch {
                skipped++;
            }
        }

        await this.em.flush();
        return { imported, skipped, importedDevices };
    }

    @CreateRequestContext()
    async importDeviceParts(parts: Record<string, any>[]): Promise<{ imported: number; skipped: number }> {
        let imported = 0;
        let skipped = 0;

        for (const entry of parts) {
            try {
                // Resolve device by slug
                let device: Device | undefined;
                if (entry.deviceModel || entry.deviceBrand || entry.deviceName) {
                    const slug = slugify(`${entry.deviceBrand ?? ''}-${entry.deviceModel ?? ''}-${entry.deviceName ?? ''}`);
                    const found = await this.em.findOne(Device, { slug });
                    if (!found) { skipped++; continue; }
                    device = found;
                }

                // Resolve category by name
                let category: DeviceCategory | undefined;
                if (entry.categoryName) {
                    const found = await this.em.findOne(DeviceCategory, { name: entry.categoryName });
                    if (found) category = found;
                }

                const part = this.em.create(DevicePart, {
                    device,
                    category,
                    name: entry.name ?? '',
                    partNumber: entry.partNumber ?? undefined,
                    price: entry.price ?? undefined,
                    description: entry.description ?? undefined,
                    group: entry.group ?? undefined,
                });
                this.em.persist(part);
                imported++;
            } catch {
                skipped++;
            }
        }

        await this.em.flush();
        return { imported, skipped };
    }

    @CreateRequestContext()
    async updateDevice(id: string, dto: {
        name?: string;
        type?: string;
        model?: string;
        brand?: string;
        price?: number;
        description?: string;
        specifications?: Record<string, any>;
        features?: Record<string, any>;
        slug?: string;
        isFeatured?: boolean;
    }): Promise<Device> {
        const device = await this.em.findOne(Device, { id });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');

        if (dto.name) device.name = dto.name;
        if (dto.type) {
            const category = await this.em.findOne(DeviceCategory, { name: dto.type });
            if (category) device.category = category;
        }
        if (dto.model) device.model = dto.model;
        if (dto.brand) device.brand = dto.brand;
        if (dto.price !== undefined) device.price = dto.price;
        if (dto.description !== undefined) device.description = dto.description;
        if (dto.specifications !== undefined) device.specifications = dto.specifications;
        if (dto.features !== undefined) device.features = dto.features;
        if (dto.slug) device.slug = dto.slug;
        if (dto.isFeatured !== undefined) device.isFeatured = dto.isFeatured;

        await this.em.flush();
        return device;
    }

    @CreateRequestContext()
    async deleteDevice(id: string): Promise<void> {
        const device = await this.em.findOne(Device, { id });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        await this.em.removeAndFlush(device);
    }

    @CreateRequestContext()
    async deleteAllDevices(): Promise<{ deletedCount: number }> {
        const count = await this.em.count(Device);
        await this.em.nativeDelete(Device, {});
        return { deletedCount: count };
    }

    // ── Device catalog (public queries) ─────────────────────────────────

    @CreateRequestContext()
    async findAll(pagination: { page?: number; limit?: number; search?: string; type?: string; isFeatured?: boolean; sortBy?: string; sortOrder?: string }): Promise<{ data: Device[]; total: number }> {
        const where: Record<string, any> = {};
        if (pagination.search) {
            where.$or = [
                { name: { $ilike: `%${pagination.search}%` } },
                { model: { $ilike: `%${pagination.search}%` } },
                { brand: { $ilike: `%${pagination.search}%` } },
            ];
        }
        if (pagination.type) {
            where.category = { name: pagination.type };
        }
        if (pagination.isFeatured) {
            where.isFeatured = true;
        }

        const limit = pagination.limit ?? 20;
        const offset = ((pagination.page ?? 1) - 1) * limit;

        const orderBy: Record<string, 'ASC' | 'DESC'> = pagination.sortBy && (DEVICE_SORTABLE_FIELDS as readonly string[]).includes(pagination.sortBy)
            ? { [pagination.sortBy]: pagination.sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [data, total] = await this.em.findAndCount(Device, where, {
            limit,
            offset,
            orderBy,
            populate: ['category'],
        });
        return { data, total };
    }

    @CreateRequestContext()
    async findById(id: string): Promise<Device> {
        const device = await this.em.findOne(Device, { id }, { populate: ['category'] });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        return device;
    }

    @CreateRequestContext()
    async findBySlug(slug: string): Promise<Device> {
        const device = await this.em.findOne(Device, { slug }, { populate: ['category'] });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        return device;
    }

    // ── User devices ────────────────────────────────────────────────────

    @CreateRequestContext()
    async registerUserDevice(userId: string, dto: {
        deviceId: string;
        serialNumber: string;
        addressId: string;
        purchaseDate?: string;
        warrantyUntil?: string;
        notes?: string;
    }): Promise<UserDevice> {
        const device = await this.em.findOne(Device, { id: dto.deviceId });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');

        let address = await this.em.findOne(Address, { id: dto.addressId });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');
        if (address.userId !== userId) {
            address = await this.cloneAddressForUser(address, userId);
        }
        assertAddressValid(address);

        const userDevice = this.em.create(UserDevice, {
            userId,
            device,
            serialNumber: dto.serialNumber,
            address,
            purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
            warrantyUntil: dto.warrantyUntil ? new Date(dto.warrantyUntil) : undefined,
            notes: dto.notes,
        });
        await this.em.persistAndFlush(userDevice);

        // Sign device registration
        const regPayload = {
            userId,
            userDeviceId: userDevice.id,
            serialNumber: dto.serialNumber,
            signedAt: new Date().toISOString(),
        };
        userDevice.registrationSignedPayload = JSON.stringify(regPayload, Object.keys(regPayload).sort());
        userDevice.registrationSignature = this.signatureService.sign(regPayload);
        await this.em.flush();

        // Queue async device validation (dup check + external S/N)
        this.deviceValidationPublisher.emit({
            userDeviceId: userDevice.id,
            userId,
            deviceId: dto.deviceId,
            serialNumber: dto.serialNumber,
            attempt: 0,
        });

        return userDevice;
    }

    @CreateRequestContext()
    async updateUserDevice(userId: string, id: string, dto: {
        addressId?: string;
        serialNumber?: string;
        notes?: string;
    }): Promise<UserDevice> {
        const userDevice = await this.em.findOne(UserDevice, { id, userId }, {
            populate: ['device', 'address'],
        });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');

        if (dto.addressId) {
            let address = await this.em.findOne(Address, { id: dto.addressId });
            if (!address) throw AppErrors.dbEntityNotFound('Address not found');
            if (address.userId !== userId) {
                address = await this.cloneAddressForUser(address, userId);
            }
            userDevice.address = address;
        }

        const serialChanged = dto.serialNumber && dto.serialNumber !== userDevice.serialNumber;
        if (dto.serialNumber) {
            userDevice.serialNumber = dto.serialNumber;
        }

        if (dto.notes !== undefined) {
            userDevice.notes = dto.notes;
        }

        // Re-validate if serial number changed
        if (serialChanged) {
            userDevice.validationStatus = 'pending';
            userDevice.validationError = undefined;
        }

        await this.em.flush();

        if (serialChanged) {
            const deviceId = typeof userDevice.device === 'object' ? userDevice.device.id : String(userDevice.device);
            this.deviceValidationPublisher.emit({
                userDeviceId: userDevice.id,
                userId,
                deviceId,
                serialNumber: userDevice.serialNumber,
                attempt: 0,
            });
        }

        return userDevice;
    }

    @CreateRequestContext()
    async getUserDevices(userId: string): Promise<UserDevice[]> {
        return this.em.find(UserDevice, { userId }, {
            populate: ['device', 'address'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    @CreateRequestContext()
    async getUserDevice(userId: string, id: string): Promise<UserDevice> {
        const userDevice = await this.em.findOne(UserDevice, { id, userId }, {
            populate: ['device', 'address'],
        });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        return userDevice;
    }

    @CreateRequestContext()
    async removeUserDevice(userId: string, id: string): Promise<void> {
        const userDevice = await this.em.findOne(UserDevice, { id, userId });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        await this.em.removeAndFlush(userDevice);
    }

    // ── Device parts catalog ───────────────────────────────────────────

    @CreateRequestContext()
    async getAllDeviceParts(params: {
        page?: number;
        limit?: number;
        search?: string;
        deviceId?: string;
        categoryId?: string;
        genericOnly?: boolean;
    }): Promise<{ data: DevicePart[]; total: number }> {
        const where: Record<string, any> = {};

        if (params.search) {
            where.$or = [
                { name: { $ilike: `%${params.search}%` } },
                { partNumber: { $ilike: `%${params.search}%` } },
                { description: { $ilike: `%${params.search}%` } },
                { group: { $ilike: `%${params.search}%` } },
            ];
        }

        if (params.genericOnly) {
            where.device = null;
        } else if (params.deviceId) {
            where.device = params.deviceId;
        }

        if (params.categoryId) {
            where.category = params.categoryId;
        }

        const limit = params.limit ?? 50;
        const offset = ((params.page ?? 1) - 1) * limit;

        const [data, total] = await this.em.findAndCount(DevicePart, where, {
            limit,
            offset,
            populate: ['device', 'category'],
            orderBy: { group: 'ASC', name: 'ASC' },
        });

        return { data, total };
    }

    @CreateRequestContext()
    async createDevicePart(deviceId: string | undefined, dto: {
        name: string;
        partNumber?: string;
        price?: number;
        description?: string;
        group?: string;
        categoryId?: string;
    }): Promise<DevicePart> {
        let device: Device | undefined;
        if (deviceId) {
            const found = await this.em.findOne(Device, { id: deviceId });
            if (!found) throw AppErrors.dbEntityNotFound('Device not found');
            device = found;
        }

        let category: DeviceCategory | undefined;
        if (dto.categoryId) {
            const found = await this.em.findOne(DeviceCategory, { id: dto.categoryId });
            if (!found) throw AppErrors.dbEntityNotFound('Device category not found');
            category = found;
        }

        const part = this.em.create(DevicePart, {
            device,
            category,
            group: dto.group,
            name: dto.name,
            partNumber: dto.partNumber,
            price: dto.price,
            description: dto.description,
        });
        await this.em.persistAndFlush(part);
        return part;
    }

    @CreateRequestContext()
    async updateDevicePart(partId: string, dto: {
        name?: string;
        partNumber?: string;
        price?: number;
        description?: string;
        deviceId?: string;
        group?: string;
        categoryId?: string;
    }): Promise<DevicePart> {
        const part = await this.em.findOne(DevicePart, { id: partId });
        if (!part) throw AppErrors.dbEntityNotFound('Device part not found');

        if (dto.name) part.name = dto.name;
        if (dto.partNumber !== undefined) part.partNumber = dto.partNumber;
        if (dto.price !== undefined) part.price = dto.price;
        if (dto.description !== undefined) part.description = dto.description;
        if (dto.group !== undefined) part.group = dto.group || undefined;

        if (dto.deviceId !== undefined) {
            if (dto.deviceId) {
                const device = await this.em.findOne(Device, { id: dto.deviceId });
                if (!device) throw AppErrors.dbEntityNotFound('Device not found');
                part.device = device;
            } else {
                part.device = undefined;
            }
        }

        if (dto.categoryId !== undefined) {
            if (dto.categoryId) {
                const category = await this.em.findOne(DeviceCategory, { id: dto.categoryId });
                if (!category) throw AppErrors.dbEntityNotFound('Device category not found');
                part.category = category;
            } else {
                part.category = undefined;
            }
        }

        await this.em.flush();
        return part;
    }

    @CreateRequestContext()
    async deleteDevicePart(partId: string): Promise<void> {
        const part = await this.em.findOne(DevicePart, { id: partId });
        if (!part) throw AppErrors.dbEntityNotFound('Device part not found');
        await this.em.removeAndFlush(part);
    }

    @CreateRequestContext()
    async getDeviceParts(deviceId: string): Promise<DevicePart[]> {
        return this.em.find(DevicePart, { device: deviceId }, { orderBy: { name: 'ASC' } });
    }

    @CreateRequestContext()
    async findUserDeviceById(id: string): Promise<UserDevice> {
        const userDevice = await this.em.findOne(UserDevice, { id }, {
            populate: ['device', 'address'],
        });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        return userDevice;
    }
}

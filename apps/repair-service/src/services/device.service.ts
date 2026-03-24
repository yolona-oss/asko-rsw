import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Device, UserDevice, Address, DevicePart } from 'entities';
import { DeviceType } from '@asko/shared';
import { AppErrors } from 'common/error';

/** Simple slugify helper: lowercase, replace non-alphanum with dashes, trim dashes */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

@Injectable()
export class DeviceService {
    constructor(
        private readonly em: EntityManager,
    ) {}

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

        const device = this.em.create(Device, {
            name: dto.name,
            type: dto.type as DeviceType,
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
    async importDevices(products: Record<string, any>[]): Promise<{ imported: number; skipped: number }> {
        let imported = 0;
        let skipped = 0;

        for (const product of products) {
            try {
                const slug = slugify(`${product.brand ?? ''}-${product.model ?? ''}-${product.name ?? ''}`);
                const existing = await this.em.findOne(Device, { slug });
                if (existing) {
                    skipped++;
                    continue;
                }

                const device = this.em.create(Device, {
                    name: product.name ?? '',
                    type: (product.type as DeviceType) ?? DeviceType.OTHER,
                    model: product.model ?? '',
                    brand: product.brand ?? '',
                    price: product.price ?? undefined,
                    description: product.description ?? undefined,
                    specifications: product.specifications ?? undefined,
                    features: product.features ?? undefined,
                    slug,
                    isFeatured: product.isFeatured ?? false,
                });
                this.em.persist(device);
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
        if (dto.type) device.type = dto.type as DeviceType;
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
    async findAll(pagination: { offset?: number; limit?: number; search?: string }): Promise<{ data: Device[]; total: number }> {
        const where: Record<string, any> = {};
        if (pagination.search) {
            where.$or = [
                { name: { $ilike: `%${pagination.search}%` } },
                { model: { $ilike: `%${pagination.search}%` } },
                { brand: { $ilike: `%${pagination.search}%` } },
            ];
        }

        const limit = pagination.limit ?? 20;
        const offset = ((pagination.offset ?? 1) - 1) * limit;

        const [data, total] = await this.em.findAndCount(Device, where, {
            limit,
            offset,
            orderBy: { createdAt: 'DESC' },
        });
        return { data, total };
    }

    @CreateRequestContext()
    async findById(id: string): Promise<Device> {
        const device = await this.em.findOne(Device, { id });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        return device;
    }

    @CreateRequestContext()
    async findBySlug(slug: string): Promise<Device> {
        const device = await this.em.findOne(Device, { slug });
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

        const address = await this.em.findOne(Address, { id: dto.addressId });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');

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
    async createDevicePart(deviceId: string, dto: { name: string; partNumber?: string; price?: number; description?: string }): Promise<DevicePart> {
        const device = await this.em.findOne(Device, { id: deviceId });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');

        const part = this.em.create(DevicePart, {
            device,
            name: dto.name,
            partNumber: dto.partNumber,
            price: dto.price,
            description: dto.description,
        });
        await this.em.persistAndFlush(part);
        return part;
    }

    @CreateRequestContext()
    async updateDevicePart(partId: string, dto: { name?: string; partNumber?: string; price?: number; description?: string }): Promise<DevicePart> {
        const part = await this.em.findOne(DevicePart, { id: partId });
        if (!part) throw AppErrors.dbEntityNotFound('Device part not found');

        if (dto.name) part.name = dto.name;
        if (dto.partNumber !== undefined) part.partNumber = dto.partNumber;
        if (dto.price !== undefined) part.price = dto.price;
        if (dto.description !== undefined) part.description = dto.description;

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

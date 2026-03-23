import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Device } from 'entities/device.entity';
import { UserDevice } from 'entities/user-device.entity';
import { Address } from 'entities/address.entity';
import { DeviceType, ImageTypeEnum } from '@asko/shared';
import { AppErrors } from 'common/error';
import { FileClientService } from 'modules/file-client.service';
import { ExternalCertValidationService } from './external-cert-validation.service';

const VALID_DEVICE_TYPES = new Set<string>(Object.values(DeviceType));
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|avif)$/i;

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
        || 'device';
}

@Injectable()
export class DeviceService {
    constructor(
        private readonly em: EntityManager,
        private readonly fileService: FileClientService,
        private readonly externalCertValidation: ExternalCertValidationService,
    ) {}

    private async generateUniqueSlug(brand: string, model: string): Promise<string> {
        const base = slugify(`${brand}-${model}`);
        let slug = base;
        let counter = 1;
        while (await this.em.findOne(Device, { slug })) {
            slug = `${base}-${counter++}`;
        }
        return slug;
    }

    // ── Admin: Device catalog CRUD ──

    async createDevice(dto: { name: string; type: DeviceType; model: string; brand: string; description?: string; specifications?: Record<string, any>; features?: Record<string, any> }): Promise<Device> {
        const slug = await this.generateUniqueSlug(dto.brand, dto.model);
        const device = this.em.create(Device, {
            name: dto.name,
            type: dto.type,
            model: dto.model,
            brand: dto.brand,
            slug,
            description: dto.description,
            specifications: dto.specifications,
            features: dto.features,
        });
        await this.em.persistAndFlush(device);
        return device;
    }

    async importDevices(productsJson: string): Promise<{ created: number; errors: string[] }> {
        let products: Record<string, any>[];
        try {
            products = JSON.parse(productsJson);
        } catch {
            throw AppErrors.badRequest('Invalid JSON');
        }

        let created = 0;
        const errors: string[] = [];

        for (const product of products) {
            const fork = this.em.fork();
            try {
                const type = VALID_DEVICE_TYPES.has(product.type)
                    ? (product.type as DeviceType)
                    : DeviceType.OTHER;

                const specs = product.specifications;
                const specifications = specs?.technical && typeof specs.technical === 'object'
                    ? specs.technical
                    : undefined;

                let features: Record<string, string> | undefined;
                if (Array.isArray(specs?.features)) {
                    features = {};
                    for (const item of specs.features) {
                        const idx = String(item).indexOf(': ');
                        if (idx !== -1) {
                            features[String(item).slice(0, idx)] = String(item).slice(idx + 2);
                        }
                    }
                } else if (specs?.features && typeof specs.features === 'object' && !Array.isArray(specs.features)) {
                    features = specs.features;
                }

                const brandStr = String(product.brand ?? '').slice(0, 255);
                const modelStr = String(product.model ?? '').slice(0, 255);
                const baseSlug = slugify(`${brandStr}-${modelStr}`);
                let slug = baseSlug;
                let counter = 1;
                while (await fork.findOne(Device, { slug })) {
                    slug = `${baseSlug}-${counter++}`;
                }

                const device = fork.create(Device, {
                    name: String(product.name ?? '').slice(0, 255),
                    type,
                    model: modelStr,
                    brand: brandStr,
                    slug,
                    price: product.price ?? Math.floor(Math.random() * 200000) + 20000,
                    description: product.description,
                    specifications,
                    features,
                });

                await fork.persistAndFlush(device);

                if (Array.isArray(product.images)) {
                    let order = 0;
                    for (const url of product.images) {
                        if (typeof url !== 'string' || !IMAGE_EXTENSIONS.test(url)) continue;
                        try {
                            await this.fileService.createFromUrl(url, ImageTypeEnum.Device, device.id, order++);
                        } catch {
                            console.error(`DeviceService::importDevices(): Cannot create image entity`);
                        }
                    }
                }

                created++;
            } catch (e: any) {
                errors.push(`${product.name ?? 'unknown'}: ${e.message}`);
            }
        }

        return { created, errors };
    }

    async updateDevice(id: string, dto: Record<string, any>): Promise<Device> {
        const device = await this.em.findOne(Device, { id });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        this.em.assign(device, dto);
        await this.em.flush();
        return device;
    }

    async deleteDevice(id: string): Promise<void> {
        const device = await this.em.findOne(Device, { id });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        await this.em.removeAndFlush(device);
    }

    async deleteAllDevices(): Promise<number> {
        return this.em.nativeDelete(Device, {});
    }

    async findAll(pagination: { offset?: number; limit?: number; search?: string }): Promise<{ data: Device[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Device,
            pagination.search
                ? { $or: [{ name: { $ilike: `%${pagination.search}%` } }, { model: { $ilike: `%${pagination.search}%` } }] }
                : {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
            }
        );
        return { data, total };
    }

    async findById(id: string): Promise<Device> {
        const device = await this.em.findOne(Device, { id });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        return device;
    }

    async findBySlug(slug: string): Promise<Device> {
        const device = await this.em.findOne(Device, { slug });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found');
        return device;
    }

    // ── User: device registration ──

    async registerUserDevice(userId: string, dto: { deviceId: string; serialNumber: string; addressId: string; purchaseDate?: string; warrantyUntil?: string; notes?: string }): Promise<UserDevice> {
        await this.externalCertValidation.externalFactorySerialNumberValidator(dto.serialNumber);

        const device = await this.em.findOne(Device, { id: dto.deviceId });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found in catalog');

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

    async getUserDevices(userId: string): Promise<UserDevice[]> {
        return this.em.find(UserDevice, { userId }, { populate: ['device', 'address'] });
    }

    async getUserDevice(userId: string, id: string): Promise<UserDevice> {
        const ud = await this.em.findOne(UserDevice, { id, userId }, { populate: ['device', 'address'] });
        if (!ud) throw AppErrors.dbEntityNotFound('User device not found');
        return ud;
    }

    async removeUserDevice(userId: string, id: string): Promise<void> {
        const ud = await this.em.findOne(UserDevice, { id, userId });
        if (!ud) throw AppErrors.dbEntityNotFound('User device not found');
        await this.em.removeAndFlush(ud);
    }

    async findUserDeviceById(id: string): Promise<UserDevice> {
        const ud = await this.em.findOne(UserDevice, { id }, { populate: ['device', 'address'] });
        if (!ud) throw AppErrors.dbEntityNotFound('User device not found');
        return ud;
    }
}

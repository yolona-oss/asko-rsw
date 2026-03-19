import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Device, UserDevice, Address } from 'entities';
import { CreateDeviceDto, UpdateDeviceDto, RegisterUserDeviceDto, PaginationDto, DeviceType, ImageTypeEnum } from '@asko/shared';
import { AppErrors } from 'common/error';
import { ImageService } from 'modules/file-upload/services/image.service';

import { slugify } from 'common/utils'
import { randomInt } from 'crypto';

const VALID_DEVICE_TYPES = new Set<string>(Object.values(DeviceType));
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|avif)$/i;

@Injectable()
export class DeviceService {
    constructor(
        private readonly em: EntityManager,
        private readonly imageService: ImageService,
    ) { }

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

    async createDevice(dto: CreateDeviceDto): Promise<Device> {
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

    async importDevices(products: Record<string, any>[]): Promise<{ created: number; errors: string[] }> {
        let created = 0;
        const errors: string[] = [];

        for (const product of products) {
            const fork = this.em.fork();
            try {
                const type = VALID_DEVICE_TYPES.has(product.type)
                    ? (product.type as DeviceType)
                    : DeviceType.OTHER;

                const specs = product.specifications;

                // specifications: use the flat technical object
                const specifications = specs?.technical && typeof specs.technical === 'object'
                    ? specs.technical
                    : undefined;

                // features: convert ["key: value", ...] array to { key: value }
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
                    // NOTE USES RANDOMIZER FOR PRICE(MUST BE REMOVED IN RELEACE) used cause no device data provided by service customer and used own scraper
                    price: product.price ?? randomInt(5),
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
                            await this.imageService.createFromUrl(url, ImageTypeEnum.Device, device.id, order++);
                        } catch {
                            console.error(`DeviceService::importDevices(): Cannot create image entitiy with static url entitiy`)
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

    async updateDevice(id: string, dto: UpdateDeviceDto): Promise<Device> {
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

    async findAll(pagination: PaginationDto): Promise<{ data: Device[]; total: number }> {
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

    async registerUserDevice(userId: string, dto: RegisterUserDeviceDto): Promise<UserDevice> {
        const device = await this.em.findOne(Device, { id: dto.deviceId });
        if (!device) throw AppErrors.dbEntityNotFound('Device not found in catalog');

        const address = await this.em.findOne(Address, { id: dto.addressId });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');

        const userDevice = this.em.create(UserDevice, {
            user: userId,
            device: device,
            serialNumber: dto.serialNumber,
            address: address,
            purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
            warrantyUntil: dto.warrantyUntil ? new Date(dto.warrantyUntil) : undefined,
            notes: dto.notes,
        });
        await this.em.persistAndFlush(userDevice);
        return userDevice;
    }

    async getUserDevices(userId: string): Promise<UserDevice[]> {
        return this.em.find(UserDevice, { user: userId }, { populate: ['device', 'address'] });
    }

    async getUserDevice(userId: string, id: string): Promise<UserDevice> {
        const ud = await this.em.findOne(UserDevice, { id, user: userId }, { populate: ['device', 'address'] });
        if (!ud) throw AppErrors.dbEntityNotFound('User device not found');
        return ud;
    }

    async removeUserDevice(userId: string, id: string): Promise<void> {
        const ud = await this.em.findOne(UserDevice, { id, user: userId });
        if (!ud) throw AppErrors.dbEntityNotFound('User device not found');
        await this.em.removeAndFlush(ud);
    }
}

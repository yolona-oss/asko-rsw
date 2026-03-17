import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Device, UserDevice, Address } from 'entities';
import { CreateDeviceDto, UpdateDeviceDto, RegisterUserDeviceDto, PaginationDto, DeviceType } from '@asko/shared';
import { AppErrors } from 'common/error';

const VALID_DEVICE_TYPES = new Set<string>(Object.values(DeviceType));

@Injectable()
export class DeviceService {
    constructor(private readonly em: EntityManager) {}

    // ── Admin: Device catalog CRUD ──

    async createDevice(dto: CreateDeviceDto): Promise<Device> {
        const device = this.em.create(Device, {
            name: dto.name,
            type: dto.type,
            model: dto.model,
            brand: dto.brand,
            description: dto.description,
            specifications: dto.specifications,
            features: dto.features,
            link: dto.link,
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

                const device = fork.create(Device, {
                    name: String(product.name ?? '').slice(0, 255),
                    type,
                    model: String(product.model ?? '').slice(0, 255),
                    brand: String(product.brand ?? '').slice(0, 255),
                    description: product.description,
                    specifications,
                    features,
                    link: String(specs?.url ?? '').slice(0, 500) || undefined,
                });

                await fork.persistAndFlush(device);
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

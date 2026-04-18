import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { DeviceCategory } from 'modules/device/entities/device-category.entity';
import { Device } from 'modules/device/entities/device.entity';
import { msg } from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class DeviceCategoryService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async findAll(): Promise<DeviceCategory[]> {
        return this.em.find(DeviceCategory, {}, { orderBy: { order: 'ASC' } });
    }

    @CreateRequestContext()
    async findById(id: string): Promise<DeviceCategory> {
        const category = await this.em.findOne(DeviceCategory, { id });
        if (!category) throw AppErrors.dbEntityNotFound({ key: msg.device.categoryNotFound });
        return category;
    }

    @CreateRequestContext()
    async findByName(name: string): Promise<DeviceCategory> {
        const category = await this.em.findOne(DeviceCategory, { name });
        if (!category) throw AppErrors.dbEntityNotFound({ key: msg.device.categoryNotFound });
        return category;
    }

    @CreateRequestContext()
    async create(dto: { name: string; label: string; labelPlural: string; order?: number }): Promise<DeviceCategory> {
        const category = this.em.create(DeviceCategory, {
            name: dto.name,
            label: dto.label,
            labelPlural: dto.labelPlural,
            order: dto.order ?? 0,
        });
        await this.em.persistAndFlush(category);
        return category;
    }

    @CreateRequestContext()
    async update(id: string, dto: { name?: string; label?: string; labelPlural?: string; order?: number }): Promise<DeviceCategory> {
        const category = await this.em.findOne(DeviceCategory, { id });
        if (!category) throw AppErrors.dbEntityNotFound({ key: msg.device.categoryNotFound });
        this.em.assign(category, dto);
        await this.em.flush();
        return category;
    }

    @CreateRequestContext()
    async delete(id: string): Promise<void> {
        const category = await this.em.findOne(DeviceCategory, { id });
        if (!category) throw AppErrors.dbEntityNotFound({ key: msg.device.categoryNotFound });

        const deviceCount = await this.em.count(Device, { category: { id } });
        if (deviceCount > 0) {
            throw AppErrors.badRequest({ key: msg.device.cannotDeleteWithDevices, params: { count: deviceCount } });
        }

        await this.em.removeAndFlush(category);
    }
}

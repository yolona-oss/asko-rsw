import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Repairer } from 'modules/repairer/entities/repairer.entity';
import { AppErrors } from 'common/error';
import { resolveTimezone } from 'common/timezone-lookup';

const REPAIRER_SORTABLE_FIELDS = ['createdAt', 'city', 'completedRepairs', 'isActive'] as const;

@Injectable()
export class RepairerService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async create(userId: string, city: string, specializations: string[] = []): Promise<Repairer> {
        const existing = await this.em.findOne(Repairer, { userId });
        if (existing) throw AppErrors.dbEntityExists('Repairer profile already exists');

        const repairer = this.em.create(Repairer, {
            userId,
            city,
            specializations,
            timezone: resolveTimezone(city),
        });
        await this.em.persistAndFlush(repairer);
        return repairer;
    }

    @CreateRequestContext()
    async update(id: string, dto: {
        city?: string;
        specializations?: string[];
        isActive?: boolean;
    }): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { id });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');

        if (dto.city) {
            repairer.city = dto.city;
            repairer.timezone = resolveTimezone(dto.city);
        }
        if (dto.specializations !== undefined) repairer.specializations = dto.specializations;
        if (dto.isActive !== undefined) repairer.isActive = dto.isActive;

        await this.em.flush();
        return repairer;
    }

    @CreateRequestContext()
    async updateLocation(userId: string, latitude: number, longitude: number): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { userId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');

        repairer.latitude = latitude;
        repairer.longitude = longitude;
        repairer.timezone = resolveTimezone(repairer.city, longitude);
        repairer.lastLocationUpdate = new Date();

        await this.em.flush();
        return repairer;
    }

    @CreateRequestContext()
    async getMyProfile(userId: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { userId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');
        return repairer;
    }

    @CreateRequestContext()
    async findAll(pagination: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }): Promise<{ data: Repairer[]; total: number }> {
        const where: Record<string, any> = {};
        if (pagination.search) {
            where.$or = [
                { city: { $ilike: `%${pagination.search}%` } },
            ];
        }

        const limit = pagination.limit ?? 20;
        const offset = ((pagination.page ?? 1) - 1) * limit;

        const orderBy: Record<string, 'ASC' | 'DESC'> = pagination.sortBy && (REPAIRER_SORTABLE_FIELDS as readonly string[]).includes(pagination.sortBy)
            ? { [pagination.sortBy]: pagination.sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [data, total] = await this.em.findAndCount(Repairer, where, {
            limit,
            offset,
            orderBy,
        });
        return { data, total };
    }

    @CreateRequestContext()
    async findById(id: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { id });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        return repairer;
    }

    @CreateRequestContext()
    async findByUserId(userId: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { userId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        return repairer;
    }

    @CreateRequestContext()
    async findActiveInCity(city: string): Promise<Repairer[]> {
        return this.em.find(Repairer, { city, isActive: true });
    }

    @CreateRequestContext()
    async incrementCompleted(id: string): Promise<void> {
        const repairer = await this.em.findOne(Repairer, { id });
        if (!repairer) return;
        repairer.completedRepairs += 1;
        await this.em.flush();
    }

    @CreateRequestContext()
    async updateLastLocation(id: string, latitude: number, longitude: number): Promise<void> {
        const repairer = await this.em.findOne(Repairer, { id });
        if (!repairer) return;
        repairer.latitude = latitude;
        repairer.longitude = longitude;
        repairer.lastLocationUpdate = new Date();
        await this.em.flush();
    }
}

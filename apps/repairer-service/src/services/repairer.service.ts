import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Repairer } from 'entities/repairer.entity';
import { AppErrors } from 'common/error';

@Injectable()
export class RepairerService {
    constructor(private readonly em: EntityManager) {}

    async create(userId: string, city: string, specializations: string[]): Promise<Repairer> {
        const existing = await this.em.findOne(Repairer, { userId });
        if (existing) throw AppErrors.dbEntityExists('Repairer profile already exists');

        const repairer = this.em.create(Repairer, {
            userId,
            city,
            specializations: specializations ?? [],
        });
        await this.em.persistAndFlush(repairer);
        return repairer;
    }

    async update(repairerId: string, dto: Record<string, any>): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { id: repairerId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        this.em.assign(repairer, dto);
        await this.em.flush();
        return repairer;
    }

    async updateLocation(userId: string, latitude: number, longitude: number): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { userId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');
        repairer.latitude = latitude;
        repairer.longitude = longitude;
        repairer.lastLocationUpdate = new Date();
        await this.em.flush();
        return repairer;
    }

    async getMyProfile(userId: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { userId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');
        return repairer;
    }

    async findAll(pagination: { offset?: number; limit?: number; search?: string }): Promise<{ data: Repairer[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Repairer,
            pagination.search ? { city: { $ilike: `%${pagination.search}%` } } : {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
            }
        );
        return { data, total };
    }

    async findById(id: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { id });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        return repairer;
    }

    async findByUserId(userId: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { userId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');
        return repairer;
    }

    async findActiveInCity(city: string): Promise<Repairer[]> {
        return this.em.find(Repairer, { city: { $ilike: city }, isActive: true });
    }

    async incrementCompleted(id: string): Promise<void> {
        const repairer = await this.em.findOne(Repairer, { id });
        if (!repairer) return;
        repairer.completedRepairs += 1;
        await this.em.flush();
    }

    async updateLastLocation(id: string, latitude: number, longitude: number): Promise<void> {
        const repairer = await this.em.findOne(Repairer, { id });
        if (!repairer) return;
        repairer.latitude = latitude;
        repairer.longitude = longitude;
        repairer.lastLocationUpdate = new Date();
        await this.em.flush();
    }
}

import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Repairer, User } from 'entities';
import { CreateRepairerDto, UpdateRepairerDto, UpdateLocationDto, PaginationDto, Role } from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class RepairerService {
    constructor(private readonly em: EntityManager) {}

    /** Admin/Manager creates a repairer profile */
    async create(dto: CreateRepairerDto): Promise<Repairer> {
        const user = await this.em.findOne(User, { id: dto.userId });
        if (!user) throw AppErrors.dbEntityNotFound('User not found');

        // Ensure user has REPAIRER role
        if (!user.roles.includes(Role.REPAIRER)) {
            user.roles = [...user.roles, Role.REPAIRER];
        }

        const existing = await this.em.findOne(Repairer, { user: dto.userId });
        if (existing) throw AppErrors.dbEntityExists('Repairer profile already exists');

        const repairer = this.em.create(Repairer, {
            user: user,
            city: dto.city,
            specializations: dto.specializations ?? [],
        });
        await this.em.persistAndFlush(repairer);
        return repairer;
    }

    /** Update repairer profile */
    async update(repairerId: string, dto: UpdateRepairerDto): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { id: repairerId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        this.em.assign(repairer, dto);
        await this.em.flush();
        return repairer;
    }

    /** Repairer updates own location */
    async updateLocation(repairerUserId: string, dto: UpdateLocationDto): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');
        repairer.latitude = dto.latitude;
        repairer.longitude = dto.longitude;
        repairer.lastLocationUpdate = new Date();
        await this.em.flush();
        return repairer;
    }

    /** Get my repairer profile */
    async getMyProfile(userId: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { user: userId }, { populate: ['user'] });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');
        return repairer;
    }

    /** Manager/Admin lists repairers (with location data) */
    async findAll(pagination: PaginationDto): Promise<{ data: Repairer[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Repairer,
            pagination.search
                ? { $or: [{ city: { $ilike: `%${pagination.search}%` } }] }
                : {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['user'],
            }
        );
        return { data, total };
    }

    async findById(id: string): Promise<Repairer> {
        const repairer = await this.em.findOne(Repairer, { id }, { populate: ['user'] });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        return repairer;
    }

    /** Find active repairers in a city (for manager assignment) */
    async findActiveInCity(city: string): Promise<Repairer[]> {
        return this.em.find(
            Repairer,
            { city: { $ilike: city }, isActive: true },
            { populate: ['user'] }
        );
    }
}

import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Vacation } from '../entities/vacation.entity';
import { ScheduleStatus } from '../entities/schedule-status.enum';
import type { CreateVacationRequest, UpdateVacationRequest, FindAllSchedulesRequest } from '@asko/proto';

function parseDate(value: string): Date {
    return new Date(value);
}

function computeDateTo(dateFrom: Date, durationDays: number): Date {
    return new Date(dateFrom.getTime() + (durationDays - 1) * 86_400_000);
}

@Injectable()
export class VacationService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async create(data: CreateVacationRequest): Promise<Vacation> {
        const entry = new Vacation();
        entry.userId = data.userId;
        entry.dateFrom = parseDate(data.dateFrom);
        entry.durationDays = data.durationDays;
        entry.dateTo = computeDateTo(entry.dateFrom, data.durationDays);
        entry.note = data.note || null;
        entry.status = ScheduleStatus.PENDING;
        entry.createdBy = data.actorId || null;
        await this.em.persistAndFlush(entry);
        return entry;
    }

    @CreateRequestContext()
    async findAll(query: FindAllSchedulesRequest): Promise<{ data: Vacation[]; overallCount: number; page: number; limit: number }> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const where: any = {};
        if (query.userId) where.userId = query.userId;
        if (query.status) where.status = query.status.includes(',') ? { $in: query.status.split(',') } : query.status;
        if (query.dateFrom) where.dateTo = { $gte: parseDate(query.dateFrom) };
        if (query.dateTo) where.dateFrom = { $lte: parseDate(query.dateTo) };
        const orderBy: any = query.sortBy
            ? { [query.sortBy]: query.sortOrder === 'desc' ? 'DESC' : 'ASC' }
            : { dateFrom: 'DESC' };

        const [data, overallCount] = await this.em.findAndCount(Vacation, where, {
            orderBy,
            limit,
            offset: (page - 1) * limit,
        });
        return { data, overallCount, page, limit };
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<Vacation> {
        return this.em.findOneOrFail(Vacation, { id });
    }

    @CreateRequestContext()
    async update(id: string, data: UpdateVacationRequest): Promise<Vacation> {
        const entry = await this.em.findOneOrFail(Vacation, { id });
        if (data.dateTo !== undefined && data.dateTo !== '') {
            const newDateTo = parseDate(data.dateTo);
            entry.dateTo = newDateTo;
            const diffMs = newDateTo.getTime() - entry.dateFrom.getTime();
            entry.durationDays = Math.max(1, Math.floor(diffMs / 86_400_000) + 1);
        }
        if (data.note !== undefined) entry.note = data.note || null;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async delete(id: string): Promise<{ id: string; userId: string }> {
        const entry = await this.em.findOneOrFail(Vacation, { id });
        const snapshot = { id: entry.id, userId: entry.userId };
        await this.em.removeAndFlush(entry);
        return snapshot;
    }

    @CreateRequestContext()
    async approve(id: string, approvedBy: string): Promise<Vacation> {
        const entry = await this.em.findOneOrFail(Vacation, { id });
        entry.status = ScheduleStatus.APPROVED;
        entry.approvedBy = approvedBy;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async reject(id: string, approvedBy: string): Promise<Vacation> {
        const entry = await this.em.findOneOrFail(Vacation, { id });
        entry.status = ScheduleStatus.REJECTED;
        entry.approvedBy = approvedBy;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async findBlockingToday(userId: string, today: Date): Promise<Vacation | null> {
        return this.em.findOne(Vacation, {
            userId,
            status: ScheduleStatus.APPROVED,
            dateFrom: { $lte: today },
            dateTo: { $gte: today },
        });
    }

    @CreateRequestContext()
    async findActiveForUser(userId: string, excludeId?: string): Promise<Vacation | null> {
        const today = new Date().toISOString().slice(0, 10);
        const where: any = {
            userId,
            status: { $ne: ScheduleStatus.REJECTED },
            dateTo: { $gte: parseDate(today) },
        };
        if (excludeId) where.id = { $ne: excludeId };
        return this.em.findOne(Vacation, where);
    }

    @CreateRequestContext()
    async findInRange(userId: string, dateFrom: Date, dateTo: Date): Promise<Vacation[]> {
        return this.em.find(Vacation, {
            userId,
            status: ScheduleStatus.APPROVED,
            dateFrom: { $lte: dateTo },
            dateTo: { $gte: dateFrom },
        });
    }
}

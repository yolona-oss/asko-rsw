import { CreateRequestContext, EntityManager, EntityClass } from '@mikro-orm/postgresql';
import { ScheduleStatus } from '../entities/schedule-status.enum';
import { parseDate, computeDateTo } from './schedule-utils';

/** Shared fields for leave-type entities (Vacation, SickLeave). */
export interface LeaveEntity {
    id: string;
    userId: string;
    dateFrom: Date;
    durationDays: number;
    dateTo: Date;
    status: ScheduleStatus;
    createdBy?: string | null;
    approvedBy?: string | null;
    note?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateLeaveData {
    userId: string;
    dateFrom: string;
    durationDays: number;
    note?: string;
    actorId?: string;
}

interface UpdateLeaveData {
    id: string;
    dateTo?: string;
    note?: string;
    actorId?: string;
}

interface FindAllQuery {
    page?: number;
    limit?: number;
    userId?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
}

export abstract class BaseLeaveService<T extends LeaveEntity> {
    constructor(
        protected readonly em: EntityManager,
        protected readonly entityClass: EntityClass<T>,
    ) {}

    protected abstract newEntity(): T;

    @CreateRequestContext()
    async create(data: CreateLeaveData): Promise<T> {
        const entry = this.newEntity();
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
    async findAll(query: FindAllQuery): Promise<{ data: T[]; overallCount: number; page: number; limit: number }> {
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

        const opts: any = { orderBy };
        if (limit > 0) { opts.limit = limit; opts.offset = (page - 1) * limit; }
        const [data, overallCount] = await this.em.findAndCount(this.entityClass, where, opts);
        return { data, overallCount, page, limit };
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<T> {
        return this.em.findOneOrFail(this.entityClass, { id } as any);
    }

    @CreateRequestContext()
    async update(id: string, data: UpdateLeaveData): Promise<T> {
        const entry = await this.em.findOneOrFail(this.entityClass, { id } as any);
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
        const entry = await this.em.findOneOrFail(this.entityClass, { id } as any);
        const snapshot = { id: entry.id, userId: entry.userId };
        await this.em.removeAndFlush(entry);
        return snapshot;
    }

    @CreateRequestContext()
    async approve(id: string, approvedBy: string): Promise<T> {
        const entry = await this.em.findOneOrFail(this.entityClass, { id } as any);
        entry.status = ScheduleStatus.APPROVED;
        entry.approvedBy = approvedBy;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async reject(id: string, approvedBy: string): Promise<T> {
        const entry = await this.em.findOneOrFail(this.entityClass, { id } as any);
        entry.status = ScheduleStatus.REJECTED;
        entry.approvedBy = approvedBy;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async findBlockingToday(userId: string, today: Date): Promise<T | null> {
        return this.em.findOne(this.entityClass, {
            userId,
            status: ScheduleStatus.APPROVED,
            dateFrom: { $lte: today },
            dateTo: { $gte: today },
        } as any);
    }

    @CreateRequestContext()
    async findActiveForUser(userId: string, excludeId?: string): Promise<T | null> {
        const today = new Date().toISOString().slice(0, 10);
        const where: any = {
            userId,
            status: { $ne: ScheduleStatus.REJECTED },
            dateTo: { $gte: parseDate(today) },
        };
        if (excludeId) where.id = { $ne: excludeId };
        return this.em.findOne(this.entityClass, where);
    }

    @CreateRequestContext()
    async findInRange(userId: string, dateFrom: Date, dateTo: Date): Promise<T[]> {
        return this.em.find(this.entityClass, {
            userId,
            status: ScheduleStatus.APPROVED,
            dateFrom: { $lte: dateTo },
            dateTo: { $gte: dateFrom },
        } as any);
    }
}
